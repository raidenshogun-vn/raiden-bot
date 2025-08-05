function getErrorMessage(language) {
  return (languages[language] || languages.vn).ERROR_MESSAGE;
}
module.exports=getErrorMessage;