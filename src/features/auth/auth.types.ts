export type IsOldUserResponse = {
  isOldUser: boolean;
};

export type TokenRequest = {
  capability: string;
  clientId?: string;
  keyName: string;
  mac: string;
  nonce: string;
  timestamp: number;
  ttl?: number;
};
