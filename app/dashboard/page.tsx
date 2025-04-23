import DashboardClient from './DashboardClient';

export default function DashboardPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Research Dashboard</h1>
            <DashboardClient />
        </div>
    );
} 