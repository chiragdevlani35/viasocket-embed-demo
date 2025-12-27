import jwt from 'jsonwebtoken';

// In production, use environment variables for the secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface UserPayload {
  user_id: string;
  org_id: string;
project_id:string;
  iat?: number;
  exp?: number;
}

export function generateJWTToken(user_id: string): string {
  const payload: UserPayload = {
    org_id: "4009",
    project_id: "projmGNWRpns",
    user_id,
  };

  // Generate token with 1 hour expiration
  const token = jwt.sign(payload, "7EVKh5Km4pL9fycDEBLPKtzMIt66QIlUUqbmC906EdM", {
    expiresIn: '1h',
    algorithm: 'HS256'
  });

  return token;
}

export function verifyJWTToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}
