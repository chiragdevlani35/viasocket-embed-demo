import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export interface UserPayload {
  user_id: string;
  org_id: string;
  project_id: string;
  iat?: number;
  exp?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ token });
  } catch (error) {
    console.error('JWT generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
