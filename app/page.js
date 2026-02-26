import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('photoday_token')?.value;

  // Server-side instant redirect
  redirect(token ? '/app/calendar' : '/auth');
}
