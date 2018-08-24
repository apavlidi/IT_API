var ObjectId = require('mongodb').ObjectId

module.exports = [
  {
    '_id': ObjectId('5b70016cef1d40243b6514f4'),
    'date': '2018-08-12T09:44:12.411Z',
    'attachments': [],
    'publisher': {
      'name': 'alexandros pavlidis',
      'id': '5106'
    },
    'title': 'Private Announcement',
    'text': 'text',
    'textEn': 'some text',
    'titleEn': 'Private Announcement',
    '_about': ObjectId('59ab445c3eb44c2c608cb188'),
    '__v': 0
  },
  {
    '_id': ObjectId('5b7003ef8ff1ef0727fa5655'),
    'date': '2018-08-12T09:54:55.166Z',
    'attachments': [],
    'publisher': {
      'name': 'alexandros pavlidis',
      'id': '5106'
    },
    'title': 'Public Announcement',
    'text': 'This is the text.',
    'textEn': 'This is the english text.',
    'titleEn': 'Public Announcement',
    '_about': ObjectId('59ab445c3eb44c2c608cb18b'),
    '__v': 0
  },
  {
    '_id': ObjectId('5b7089606b5e19356f4633d1'),
    'date': '2018-08-12T19:24:16.226Z',
    'attachments': [],
    'publisher': {
      'name': 'alexandros pavlidis',
      'id': '5106'
    },
    'title': 'Announcement to be deleted',
    'text': 'testasdasd',
    'textEn': 'some text',
    'titleEn': 'Announcement to be deleted',
    '_about': ObjectId('59ab445c3eb44c2c608cb188'),
    '__v': 0
  },
  {
    '_id': ObjectId('5b70898133359a35a93ebaa4'),
    'date': '2018-08-12T19:24:49.349Z',
    'attachments': [],
    'publisher': {
      'name': 'alexandros pavlidis',
      'id': '5106'
    },
    'title': 'Announcement to be edited',
    'text': 'testasd',
    'textEn': 'some text',
    'titleEn': 'Announcement to be edited',
    '_about': ObjectId('59ab445c3eb44c2c608cb188'),
    '__v': 0
  },
  {
    '_id': ObjectId('5b2cb996c339ab0df1354a58'),
    'date': '2018-08-12T19:25:25.682Z',
    'attachments': [],
    'publisher': {
      'name': 'alexandros pavlidis',
      'id': '5106'
    },
    'title': 'Announcement with broken category',
    'text': 'terst666',
    'textEn': 'some text',
    'titleEn': 'Announcement with broken category',
    '_about': ObjectId('59ab445c3eb44c2c608cb300'),
    '__v': 0
  },
  {
    '_id': ObjectId('5b2cb996c339ab0df1354a54'),
    'date': '2018-08-12T19:25:25.682Z',
    'attachments': [
      ObjectId('5b6f2037fa4dac41399ead97')
    ],
    'publisher': {
      'name': 'alexandros pavlidis',
      'id': '5106'
    },
    'title': 'Private Announcement with attachments',
    'text': 'terst666',
    'textEn': 'some text',
    'titleEn': 'Private Announcement with attachments',
    '_about': ObjectId('59ab445c3eb44c2c608cb188'),
    '__v': 0
  },
  {
    '_id': ObjectId('5b2cb996c339ab0df1354a53'),
    'date': '2018-08-12T19:25:25.682Z',
    'attachments': [
      ObjectId('5b6f2037fa4dac41399ead92')
    ],
    'publisher': {
      'name': 'alexandros pavlidis',
      'id': '5106'
    },
    'title': 'Public Announcement with attachments',
    'text': 'terst666',
    'textEn': 'some text',
    'titleEn': 'Public Announcement with attachments',
    '_about': ObjectId('59ab445c3eb44c2c608cb18b'),
    '__v': 0
  },
  {
    '_id': ObjectId('5b2cb996c339ab0df1354a51'),
    'date': '2018-08-12T19:25:25.682Z',
    'attachments': [
      ObjectId('5b6f2037fa4dac41399ead93')
    ],
    'publisher': {
      'name': 'alexandros pavlidis',
      'id': '5106'
    },
    'title': 'Public Announcement with attachments to be deleted',
    'text': 'terst666',
    'textEn': 'some text',
    'titleEn': 'Public Announcement with attachments',
    '_about': ObjectId('59ab445c3eb44c2c608cb18b'),
    '__v': 0
  }
]