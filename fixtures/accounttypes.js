var ObjectId = require('mongodb').ObjectId

module.exports = [
  {
    '_id': ObjectId('59233d71d3f9430ea6323aac'),
    'title': 'Staff Accounts',
    'dec': '-',
    'value': 'staff',
    'basedn': 'ou=staff, ou=people,dc=it,dc=teithe,dc=gr',
    'primary': [
      {
        'ptitle': 'Professor',
        'ptitlegr': 'Καθηγητής',
        'value': 'prof',
        'dec': '',
        'title': 'Καθηγητες'
      },
      {
        'ptitle': 'Associate Professor',
        'ptitlegr': 'Αναπληρωτής Καθηγητής',
        'value': 'assc_prof',
        'dec': '-',
        'title': 'Αναπληρωτές Καθηγητές'
      },
      {
        'ptitle': 'Assistant Professor',
        'ptitlegr': 'Επίκουρος Καθηγητής',
        'value': 'assi_prof',
        'dec': '-',
        'title': 'Επίκουροι Καθηγητές'
      },
      {
        'ptitle': 'Laboratory Professor',
        'ptitlegr': 'Καθηγητής Εφαρμογών',
        'value': 'lab_lect',
        'dec': '-',
        'title': 'Καθηγητές Εφαρμογών'
      },
      {
        'ptitle': 'Laboratory Associate',
        'ptitlegr': 'Εργαστηριακό Διδακτικό Προσωπικό',
        'value': 'tech_staff',
        'dec': '-',
        'title': 'Εργαστηριακό Διδακτικό Προσωπικό'
      },
      {
        'ptitle': 'ΕΤΠ',
        'ptitlegr': 'ΕΤΠ',
        'value': 'ept',
        'dec': '-',
        'title': 'ΕΤΠ'
      },
      {
        'ptitle': 'Secretary',
        'ptitlegr': 'Γραμματεία',
        'value': 'admin_staff',
        'dec': '-',
        'title': 'Διοικητικό Προσωπικό'
      }
    ],
    '__v': 0
  },
  {
    '_id': ObjectId('5958f8acab9b683064459a1e'),
    'title': 'Student Accounts',
    'dec': '-',
    'value': 'student',
    'basedn': 'ou=student, ou=people,dc=it,dc=teithe,dc=gr',
    'primary': [
      {
        'ptitle': 'Undergraduate Student',
        'ptitlegr': 'Προπτυχιακός Φοιτητής',
        'value': 'it',
        'dec': 'test',
        'title': 'Bsc'
      },
      {
        'ptitle': 'Postgraduate Student ',
        'ptitlegr': 'Μεταπτυχιακός Φοιτητής',
        'value': 'ait',
        'dec': 'test2222',
        'title': 'Msc'
      }
    ],
    '__v': 0
  }
]
