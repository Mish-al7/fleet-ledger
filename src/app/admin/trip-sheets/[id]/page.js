import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import TripSheet from '@/models/TripSheet';
import { authOptions } from '@/lib/auth'; // Ensure this path is correct based on checking lib
import TripSheetForm from '../_components/TripSheetForm';

export default async function EditTripSheetPage({ params }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return <div className="text-white">Unauthorized</div>;
    }

    await dbConnect();
    const { id } = await params;

    const tripSheet = await TripSheet.findById(id);

    if (!tripSheet) {
        notFound();
    }

    // Serialize MongoDB object to plain JSON object to pass to client component
    const serializedTripSheet = JSON.parse(JSON.stringify(tripSheet));

    return <TripSheetForm initialData={serializedTripSheet} isEditing={true} />;
}
