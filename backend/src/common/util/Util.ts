export class DataUtil {
  static getCurrentDateIso(): string {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    return `${anio}_${mes}_${dia}`;
  }

  static formatDateString(inputDate: string): string {
    const year = inputDate.substring(0, 4);
    const month = inputDate.substring(4, 6);
    const day = inputDate.substring(6, 8);

    return `${day}/${month}/${year}`;
  }

  static ReplaceQuotes(cadena) {
    var resultado = '';
    var auxiliar;
    for (let k = 0; k < cadena.length; k++) {
      auxiliar = cadena.substring(k, k + 1);
      if (auxiliar == "'") {
        resultado = resultado + "\\'";
      } else if (auxiliar == '"') {
        resultado = resultado + '\\"';
      } else {
        resultado = resultado + auxiliar;
      }
    }
    return resultado;
  }
}
