class Casing {
  static kebabCase = (string: string) =>
    string
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
}

export default Casing;
