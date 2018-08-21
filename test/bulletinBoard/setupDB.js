const database = require('../../configs/database')
const mongoose = require('mongoose')

function removeAllCollections () {
  return new Promise(
    function (resolve, reject) {
      database.Announcements.remove({}, function (err) {
        if (err) {
          reject(err)
        } else {
          database.AnnouncementsCategories.remove({}, function (err) {
            if (err) {
              reject(err)
            } else {
              database.File.remove({}, function (err) {
                if (err) {
                  reject()
                } else {
                  resolve()
                }
              })
            }
          })
        }
      })
    })
}

function createAnnouncementExample (categoryID) {
  return new Promise(
    function (resolve, reject) {
      let announcementIDExample = mongoose.Types.ObjectId()
      let announcementEntry = new database.Announcements({
        _id: announcementIDExample,
        title: 'Test title',
        titleEn: 'Test title',
        text: 'Test text',
        textEn: 'Test text',
        publisher: {name: 'alexis', id: 5106},
        _about: categoryID
      })
      announcementEntry.save(function (err) {
        if (err) {
          reject(err)
        } else {
          resolve(announcementIDExample)
        }
      })
    })
}

function createAnnouncementWithFileExample (categoryID, fileID) {
  return new Promise(
    function (resolve, reject) {
      let announcementIDExample = mongoose.Types.ObjectId()
      let announcementEntry = new database.Announcements({
        _id: announcementIDExample,
        title: 'Test title',
        titleEn: 'Test title',
        text: 'Test text',
        textEn: 'Test text',
        publisher: {name: 'alexis', id: 5106},
        attachments: [fileID],
        _about: categoryID
      })
      announcementEntry.save(function (err) {
        if (err) {
          reject(err)
        } else {
          resolve(announcementIDExample)
        }
      })
    })
}

function createAnnouncementExampleToBeDeleted (categoryID) {
  return new Promise(
    function (resolve, reject) {
      let announcementIDToBeDeleted = mongoose.Types.ObjectId()
      let announcementEntry = new database.Announcements({
        _id: announcementIDToBeDeleted,
        title: 'test',
        text: 'test',
        textEn: 'test',
        titleEn: 'test',
        publisher: {name: 'alexis', id: 5106},
        _about: categoryID
      })
      announcementEntry.save(function (err) {
        if (err) {
          reject(err)
        } else {
          resolve(announcementIDToBeDeleted)
        }
      })
    })
}

function createCategoryPublicExample () {
  return new Promise(
    function (resolve, reject) {
      let categoryIDPublicExample = mongoose.Types.ObjectId()
      let categoryEntry = new database.AnnouncementsCategories({
        _id: categoryIDPublicExample,
        name: 'Category Public Example',
        nameEn: 'Category Public Example',
        value: 'CategoryPublicExample',
        public: true
      })
      categoryEntry.save(function (err) {
        if (err) {
          reject(err)
        } else {
          resolve(categoryIDPublicExample)
        }
      })
    })
}

function createCategoryPrivateExample () {
  return new Promise(
    function (resolve, reject) {
      let categoryIDPrivateExample = mongoose.Types.ObjectId()
      let categoryEntry = new database.AnnouncementsCategories({
        _id: categoryIDPrivateExample,
        name: 'Category Private Example',
        nameEn: 'Category Private Example',
        value: 'CategoryPrivateExample',
        public: false
      })
      categoryEntry.save(function (err) {
        if (err) {
          reject(err)
        } else {
          resolve(categoryIDPrivateExample)
        }
      })
    })
}

function createFileExample (announcementID) {
  return new Promise(
    function (resolve, reject) {
      let fileID = mongoose.Types.ObjectId()
      let fileEntry = new database.File({
        _id: fileID,
        name: 'Space.jpg',
        contentType: 'image/jpeg',
        data: 'Sample data',
        _announcement: announcementID
      })
      fileEntry.save(function (err) {
        if (err) {
          reject(err)
        } else {
          resolve(fileID)
        }
      })
    })
}

module.exports = {
  removeAllCollections,
  createAnnouncementExample,
  createAnnouncementWithFileExample,
  createAnnouncementExampleToBeDeleted,
  createCategoryPublicExample,
  createCategoryPrivateExample,
  createFileExample
}
