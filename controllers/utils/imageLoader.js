const multer = require("multer");
const util = require("util");
const path = require("path");


const storage = multer.memoryStorage();

const maxSize = 2 * 1024 * 1024;

const upload = multer({ 
  storage: storage, 
  fileFilter: (req, file, cb) => {
    switch (true) {
      case file.mimetype !== "image/png" && file.mimetype !== "image/jpg" && file.mimetype !== "image/jpeg":
        cb(null, false);
        return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
      case path.extname(file.originalname) !== '.jpg' && path.extname(file.originalname) !== '.jpeg' && path.extname(file.originalname) !== '.png':
        cb(null, false);
        return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }

    return cb(null, true);
  },
  limits: {
    fileSize: maxSize,
  }
}).single('image');

const uploadPromise = util.promisify(upload);

module.exports = uploadPromise;