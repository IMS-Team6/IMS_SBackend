const formidable = require('formidable');

module.exports = function({ fileValidation, globals, fileHandler, sessionValidation, fileRepository }) {

    const uploadPath = globals.uploadPath();

    const exports = {}

    exports.manageFileUpload = function(sessionID, request, callback) {
        const form = new formidable.IncomingForm();
        const errors = [];

        sessionValidation.validateSessionID(sessionID).forEach(error => {
            errors.push(error);
        });

        form.parse(request, async function(err, fields, files) {
            console.log("Parsing done.");
            console.dir(request.headers);
            console.log(fields);
            console.log(files);

            if (err) {
                callback(err, []);
                return;
            }

            //file error handling
            const file = files.collisionImg;
            console.log(file)
            fileValidation.validateFile(file).forEach(error => {
                errors.push(error);
            });

            if (errors.length > 0) {
                callback(errors, null);
                return;
            }

            const oldPath = files.collisionImg.filepath;
            const timeStamp = new Date().valueOf().toString()
            const newImgName = sessionID + '_' + timeStamp + '_' + files.collisionImg.originalFilename;
            const newPath = uploadPath + newImgName;



            fileHandler.writeFileToServer(newPath, oldPath, async function(err, success) {
                if (err > 0) {
                    errors.push(err)
                }
                const dbSuccess = await fileRepository.insertCollisionImg(sessionID, fields, newImgName);

                //When file written to server, and callback is sucess. Use newPath and send image to Google API! Store the img description object to imgCollision
                //Do it here...
                callback(errors, { dbSuccess, success })
            })
        })
    }

    exports.manageSingelFileDownload = async function(sessionID, imgName, callback) {
        const errors = [];
        const oneImg = await fileRepository.getOneCollisionImg(sessionID, imgName);
        console.log(oneImg)
        const imgPath = uploadPath + oneImg.imgName;
        callback(errors, imgPath)
    }

    exports.manageMultipleFileDownload = async function(sessionID, callback) {
        const errors = [];
        const imgArrayPath = [];
        const imgArrayObjects = await fileRepository.getAllCollisionImg(sessionID);

        //This can be avoided if path is stored in database, but that would later
        imgArrayObjects.forEach(imgObject => {
            imgArrayPath.push({
                name: imgObject.imgName,
                path: uploadPath + imgObject.imgName
            })
        })
        console.log(imgArrayPath, 'Array with path and name? ')
        callback(errors, imgArrayPath);
    }

    return exports
}