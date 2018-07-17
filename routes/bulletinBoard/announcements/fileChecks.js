const permittedTypesAnnouncements = ['text/plain', 'application/msword', 'application/octet-stream',
  'application/x-tex', 'application/pdf', 'application/mspowerpoint',
  'application/excel', 'application/rtf', 'application/vnd.ms-powerpoint',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.text', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.spreadsheet', 'application/vnd.oasis.opendocument.presentation', 'image/png', 'image/jpeg', 'image/bmp', 'image/gif', 'application/xml', 'text/xml']

function checkFileType (fileType) {
  return permittedTypesAnnouncements.indexOf(fileType) > -1
}

function validateFileSize (size) {
  return size < 5242880 // 5242880Bytes = 5Mb
}

module.exports = {
  permittedTypesAnnouncements,
  checkFileType,
  validateFileSize
}
