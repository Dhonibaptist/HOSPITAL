import { NextResponse } from 'next/server';

interface SignalMessage {
  sender: string;
  type: 'offer' | 'answer' | 'candidate';
  payload: any;
  timestamp: number;
}

// In-Memory Signaling Buffer
class SignalingBroker {
  sessions: Record<string, SignalMessage[]> = {};

  addSignal(sessionId: string, sender: string, type: 'offer' | 'answer' | 'candidate', payload: any) {
    if (!this.sessions[sessionId]) {
      this.sessions[sessionId] = [];
    }
    
    // Add new signal
    this.sessions[sessionId].push({
      sender,
      type,
      payload,
      timestamp: Date.now()
    });

    // Prune messages older than 2 minutes to conserve memory
    const twoMinutesAgo = Date.now() - 120000;
    this.sessions[sessionId] = this.sessions[sessionId].filter(m => m.timestamp > twoMinutesAgo);
  }

  getSignals(sessionId: string, receiver: string): SignalMessage[] {
    if (!this.sessions[sessionId]) return [];
    
    // Filter signals sent by the *other* party
    const matches = this.sessions[sessionId].filter(m => m.sender !== receiver);
    
    // Clear matches once consumed (one-time exchange)
    this.sessions[sessionId] = this.sessions[sessionId].filter(m => m.sender === receiver);
    
    return matches;
  }
}

const globalForBroker = global as unknown as { broker: SignalingBroker };
const broker = globalForBroker.broker || new SignalingBroker();
if (process.env.NODE_ENV !== 'production') globalForBroker.broker = broker;

export async function POST(request: Request) {
  try {
    const { sessionId, sender, type, payload } = await request.json();

    if (!sessionId || !sender || !type || !payload) {
      return NextResponse.json({ success: false, message: "Missing payload attributes" }, { status: 400 });
    }

    broker.addSignal(sessionId, sender, type, payload);
    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Signaling failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const clientName = searchParams.get('clientName');

    if (!sessionId || !clientName) {
      return NextResponse.json({ success: false, message: "Missing query properties" }, { status: 400 });
    }

    const messages = broker.getSignals(sessionId, clientName);
    return NextResponse.json({ success: true, signals: messages });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Fetch signaling failed" }, { status: 500 });
  }
}
