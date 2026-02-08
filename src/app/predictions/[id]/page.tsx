import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PredictionDetail from '@/components/predictions/prediction-detail';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PredictionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const prediction = await prisma.prediction.findUnique({
    where: {
      id: id,
      userId: session.user.id,
    },
    include: {
      feedback: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!prediction) {
    notFound();
  }

  return <PredictionDetail prediction={prediction} />;
}
