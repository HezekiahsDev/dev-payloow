class customError extends Error {
  status: number;

  constructor(message: string, statusCode?: number) {
    super(message);

    this.name = this.constructor.name;
    this.status = statusCode || 400;
  }
}

export default customError;
