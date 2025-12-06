import MainTaskDetails from '@/components/task-category/details/main-task-details';
import { decryptId } from '@/utils/aes-security-encryption';

type PageParams = { id: string };

export default async function TaskCategoryDetailsPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const param = await params;
  const decryptedId = decryptId(param.id);
  if (decryptedId) {
    return <MainTaskDetails id={decryptedId} />;
  }
}
