const multer = require("multer");
const { cloudinary } = require("../utils/cloudinary/cloudinary");

exports.uploadImg = (image, pass = false) => {
  const storage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(png|PNG|jpeg|jpg|JPG|JPEG)$/)) {
      req.fileValidationError = {
        message: "only image file are allowed!",
      };
      return cb(new Error("only image file are allowed!"), false);
    }
    cb(null, true);
  };

  const sizeMb = 2.5;
  const maxSize = sizeMb * 1000 * 1000; //

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSize,
    },
  }).single(image);

  return (req, res, next) => {
    upload(req, res, async function (err) {
      if (req.fileValidationError) {
        return res.status(400).send(req.fileValidationError);
      }

      if (!req.file && !err) {
        if (pass) return next();
        return res.status(400).send({
          message: "Please select the file",
        });
      }

      if (err) {
        if (err.code == "LIMIT_FILE_SIZE") {
          return res.status(400).send({
            message: "Max file 10MB",
          });
        }
      }

      // Upload to cloudinary
      const options = {
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        overwrite: true,
        folder: process.env.CLOUD_FOLDER,
      };

      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      await cloudinary.uploader
        .upload(dataURI, options)
        .then((res) => {
          const url = res.url
            .replace("http", "https")
            .replace("/upload", "/upload/q_auto:good");

          req.uploadImg = { ...res, url };
          return next();
        })
        .catch((err) => {
          console.error(err);
          return res.status(400).send({
            message: err,
          });
        });
    });
  };
};
