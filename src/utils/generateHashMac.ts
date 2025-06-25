import crypto from 'crypto';

class generateToken {
  createTokensHash(string: string) {
    return crypto.createHash('md5').update(string).digest('hex');
  }

  generateRandomString(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  generateShortFilename(originalFilename: string) {
    const parts = originalFilename.split('.');
    const extension = parts.pop();
    const filename = parts.join('.');
    const shortenedFilename = filename.substring(0, 10);
    return `${shortenedFilename}.${extension}`;
  }

  generateHashReference(): string {
    return `EAS-${crypto.randomBytes(9).toString('hex')}`;
  }
}

export default new generateToken();
