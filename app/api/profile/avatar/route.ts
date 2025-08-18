import { NextRequest, NextResponse } from 'next/server';

import { getUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const { user } = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const supabase = await createClient();

    const ext = file.name.split('.').pop() || 'png';
    const fileName = `avatar-${Date.now()}.${ext}`;
    const filePath = `avatars/${user.id}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: 'Failed to upload avatar', details: uploadError.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from('user-avatars').getPublicUrl(filePath);
    const publicUrl = urlData?.publicUrl || null;

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile avatar', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: updatedProfile, avatar_url: publicUrl });
  } catch {
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}


