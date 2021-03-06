const { query } = require('express');
const dbClient = require('./connectMongodb');

module.exports = function({ sessionRepository }) {
    const exports = {};

    exports.insertCollisionImg = async function(sessionID, collisionsAt, imgName) {
        await dbClient.connect();
        const request = dbClient.db("mongodb").collection("collisonImg");
        //This duplicates the entier object from mongoDB without _id
        var collisionImgObj = await request.findOne({ sessionID: '', });

        // Set the values from sessinData to the duplicated object
        delete collisionImgObj['_id']
        collisionImgObj.sessionID = sessionID;
        collisionImgObj.collisionsAt.posX = collisionsAt.posX; //.posX
        collisionImgObj.collisionsAt.posY = collisionsAt.posY;
        collisionImgObj.imgName = imgName;

        try {
            // Insert the duplicated object, mongoDB will generate new unique _id (Not to be confused with sessionID)
            const dbResponse = await request.insertOne(collisionImgObj);
            await dbClient.close();
            //await sessionRepository.updateCollisionImgStatus(sessionID);
            return dbResponse;
        } catch {
            return [
                ["internalError"]
            ]
        }
    };

    exports.getOneCollisionImg = async function(sessionID, imgName) {
        await dbClient.connect();
        const sessions = dbClient.db("mongodb").collection("collisonImg");
        try {
            const dbResponse = await sessions.findOne({ sessionID: sessionID, imgName: imgName }, { _id: 0 });
            await dbClient.close();
            if (dbResponse) {
                return dbResponse;
            } else {
                return ["imageDoesNotExist"]
            }
        } catch {
            return ["internalError"]
        }
    };

    exports.getAllCollisionImg = async function(sessionID) {

        await dbClient.connect();
        const sessions = dbClient.db("mongodb").collection("collisonImg");

        try {
            const dbResponse = await sessions.find({ sessionID: sessionID }).toArray();
            await dbClient.close();
            if (dbResponse.length > 0) {
                return dbResponse;
            } else {
                return ["imageDoesNotExist"];
            }
        } catch {
            return ["internalError"];
        }
    };
    return exports;
}
