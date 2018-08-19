let date = new Date()

const activationMailFrom = {
  el: 'IT Ηλεκτρονικές Υπηρεσίες - Εγγραφή <reg@eng.it.teithe.gr>',
  en: 'IT Web Apps - Activation <reg@eng.it.teithe.gr>'
}

const resetMailFrom = {
  el: 'IT Ηλεκτρονικές Υπηρεσίες - Επαναφορά Κώδικου <reset@eng.it.teithe.gr>',
  en: 'IT Web Apps - Reset Password <reset@eng.it.teithe.gr>'
}

const activationMailText = {
  el: function (token, mail, baseUrl) {
    return 'Γεια σας,<br>' +
      'Για να ενεργοποιήσετε τον λογαριασμό σας στο τμήμα Μηχανικών Πληροφορικής ΑΤΕΙΘ, παρακαλώ μεταβείτε στην διεύθυνση: <br/>' +
      '<a href="' + baseUrl + '/user/reg">' + baseUrl + '/user/reg</a><br>' +
      'Στην συνέχεια επιλέξτε τρόπος ταυτοποίησης <strong>Mail-Token</strong>, εισάγοντας το Token ' +
      'και το mail σας.<br>' +
      '<strong>Token:</strong> ' + token +
      '<br><strong>Mail:</strong> ' + mail +
      '<br><i style="color:red;">Το Token θα λήξει σε 48 ώρες.</i>' +
      '<br><br>' +
      ''
  },
  en: function (token, mail, baseUrl) {
    return 'Hello,<br>' +
      'In order to activate your account at Department of Information Technology A.Τ.Ε.Ι. of Thessaloniki, please follow the link below: <br/>' +
      '<a href="' + baseUrl + '/user/reg">' + baseUrl + '/user/reg</a><br>' +
      'And select Identification Type  <strong>Mail-Token</strong>, giving the information below: ' +
      '<strong>Token:</strong> ' + token +
      '<strong>Mail:</strong> ' + mail +
      '<br><i style="color:red;">Token will expire in 48 hours.</i>' +
      '<br><br>' +
      ''
  }
}

const resetMailText = {
  el: function (token, uid, baseUrl) {
    return 'Γεια σας,<br>' +
      'Λάβαμε ένα αίτημα επαναφοράς κωδικού, για να ολοκληρώσετε την διαδικασία παρακαλώ μεταβείτε στην διεύθυνση: <br/>' +
      '<a href="' + baseUrl + '/user/reset/token">' + baseUrl + '/user/reset/token</a><br>' +
      'Στην συνέχεια εισάγετε το παρακάτω token και το όνομα χρήστη σας στην φόρμα.' +
      '<br>' +
      '<strong>Token:</strong> ' + token +
      '<br><strong>Όνομα χρήστη:</strong> ' + uid +
      '<br><i style="color:red;">Το Token θα λήξει σε 1 ώρα.</i>' +
      '<br><br>' +
      'Αν δεν ζητήσατε επαναφορά κωδικού παρακαλώ αγνοήστε αυτό το mail.'
  },
  en: function (token, uid, baseUrl) {
    return 'Hello,<br>' +
      'We received a request to reset your password, in order to complete the procedure follow the link below: <br/>' +
      '<a href="' + baseUrl + '/user/reset/token">' + baseUrl + '/user/reset/token</a><br>' +
      'And use the information below: ' +
      '<strong>Token:</strong> ' + token +
      '<strong>Username:</strong> ' + uid +
      '<br><i style="color:red;">Token will expire in 1 hour.</i>' +
      '<br><br>' +
      'If you didn\'t request a new password, please ignore this mail.'
  }
}

const activationMailSubject = {
  el: {
    normalUser: 'Ενεργοποίηση Λογαριασμού',
    privUser: '[ΙΤ-' + date.getFullYear() + (date.getMonth() + 1) + date.getDate() + '] Ενεργοποίηση Λογαριασμού'
  },
  en: {
    normalUser: 'Account Activation',
    privUser: '[ΙΤ-' + date.getFullYear() + (date.getMonth() + 1) + date.getDate() + '] Account Activation'
  }
}

const resetMailSubject = {
  el: {
    normalUser: 'Επαναφορά Κωδικού',
    privUser: '[ΙΤ-' + date.getFullYear() + (date.getMonth() + 1) + date.getDate() + '] Επαναφορά Κωδικού'
  },
  en: {
    normalUser: 'Reset Password',
    privUser: '[ΙΤ-' + date.getFullYear() + (date.getMonth() + 1) + date.getDate() + '] Reset Password'
  }
}

module.exports = {
  activationMailText: activationMailText,
  activationMailSubject: activationMailSubject,
  activationMailFrom: activationMailFrom,
  resetMailFrom: resetMailFrom,
  resetMailText: resetMailText,
  resetMailSubject: resetMailSubject

}
