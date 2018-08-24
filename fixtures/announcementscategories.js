var ObjectId = require('mongodb').ObjectId

module.exports = [
  {
    '_id': ObjectId('59ab445c3eb44c2c608cb188'),
    '__v': 0,
    'name': 'Private Category',
    'nameEn': 'Private Category',
    'value': 'PrivateCategory',
    'public': false,
    'registered': []
  },
  {
    '_id': ObjectId('59ab445c3eb44c2c608cb18b'),
    '__v': 0,
    'name': 'Public Category',
    'nameEn': 'Public Category',
    'value': 'PublicCategory',
    'public': true,
    'registered': [],
    'wid': 5
  },
  {
    '_id': ObjectId('59ab445c3eb44c2c608cb182'),
    '__v': 0,
    'name': 'Category to be deleted',
    'nameEn': 'Category to be deleted',
    'value': 'CategoryToBeDeleted',
    'public': false,
    'registered': []
  },
  {
    '_id': ObjectId('59ab445c3eb44c2c608cb18d'),
    '__v': 0,
    'name': 'Category to be edited',
    'nameEn': 'Category to be edited',
    'value': 'CategoryToBeEdited',
    'public': false,
    'registered': []
  }
]