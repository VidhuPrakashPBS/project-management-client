import TaskDetails from '@/components/tasks/details/task-details';
import { decryptId } from '@/utils/aes-security-encryption';

export default async function Tasks({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TaskDetails id={decryptId(id) as string} />;
}
