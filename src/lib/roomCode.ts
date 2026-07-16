/** 8 haneli, sadece rakamdan oluşan oda kodu üretir (ör. "04918273"). */
export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) code += Math.floor(Math.random() * 10).toString();
  return code;
}
