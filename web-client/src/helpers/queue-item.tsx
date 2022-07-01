export const formatExpirationTimestamp = (expiration_timestamp: number) => {
  const expiration_date = new Date(expiration_timestamp * 1000);
  const expiration_formatted =
    expiration_date.getMonth() +
    "/" +
    (expiration_date.getDate() + 1) +
    "/" +
    expiration_date.getFullYear() +
    " " +
    expiration_date.getHours() +
    ":" +
    expiration_date.getMinutes() +
    ":" +
    expiration_date.getSeconds();
  return expiration_formatted;
};
