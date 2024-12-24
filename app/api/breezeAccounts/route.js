import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const filePath = path.join(process.cwd(), 'breezeAccounts.json');

export async function GET() {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return NextResponse.json(JSON.parse(data));
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
    }
}

export async function POST(request) {
    const body = await request.json();
    try {
        fs.writeFileSync(filePath, JSON.stringify(body, null, 2));
        return NextResponse.json({ message: 'Data saved successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}

export async function DELETE(request) {
    const { accountId } = await request.json();
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const updatedData = data.filter((account) => account.id !== accountId);
        fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
        return NextResponse.json({ message: 'Breeze account deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete Breeze account' }, { status: 500 });
    }
}