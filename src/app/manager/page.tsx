import { redirect } from 'next/navigation';

export default function KitchenIndex() {
  redirect('/manager/orders/requested');
}
