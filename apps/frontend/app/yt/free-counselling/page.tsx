import { redirect } from 'next/navigation';

/** Old YouTube URL → professional counselling-form path. */
export default function YoutubeFreeCounsellingRedirectPage() {
  redirect('/counselling-form');
}
