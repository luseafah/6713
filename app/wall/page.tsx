import WallChat from '@/components/WallChat';
import DeactivationCheck from '@/components/DeactivationCheck';
import AppWrapper from '@/components/AppWrapper';

export default function WallPage() {
  const handleNavigate = (section: string) => {
    window.location.href = `/${section}`;
  };

  return (
    <AppWrapper onNavigate={handleNavigate}>
      <DeactivationCheck>
        <WallChat />
      </DeactivationCheck>
    </AppWrapper>
  );
}
