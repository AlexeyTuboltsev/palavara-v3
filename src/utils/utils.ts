export function generateRandomString(length: number){
  const dictionary = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890'
  let result = '';
  while(result.length < length){
    result += dictionary.charAt(Math.floor(Math.random() * dictionary.length));
  }
  return result
}