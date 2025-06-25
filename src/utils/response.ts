export const response = <T>(message: string, data?: T | null, success?: boolean) => {
  return {
    message: message || {},
    data: data || null,
    success: success == null ? true : success,
  };
};
