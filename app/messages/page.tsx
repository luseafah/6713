import PopeAIChat from '@/components/PopeAIChat';
import AppWrapper from '@/components/AppWrapper';

export default function MessagesPage() {
  const handleNavigate = (section: string) => {
    window.location.href = `/${section}`;
  };

  return (
    <main className="bg-black min-h-screen">
      <AppWrapper onNavigate={handleNavigate}>
        <div className="h-screen">
          <PopeAIChat />
        </div>
      </AppWrapper>
    </main>
  );
}
