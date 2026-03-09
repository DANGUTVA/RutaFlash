import Header from '@/components/Header';
import AddressInput from '@/components/AddressInput';
import RouteList from '@/components/RouteList';
import NavigationPanel from '@/components/NavigationPanel';
import RouteMap from '@/components/RouteMap';
import RouteStats from '@/components/RouteStats';
import { useRouteState } from '@/hooks/use-route-state';

const Index = () => {
  const state = useRouteState();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-7xl px-4 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <AddressInput
              inputText={state.inputText}
              setInputText={state.setInputText}
              ocrProgress={state.ocrProgress}
              isProcessing={state.isProcessing}
              onScan={() => state.fileInputRef.current?.click()}
              onLocation={state.getLocation}
              onProcess={state.processAddresses}
              onClear={state.clearAll}
              fileInputRef={state.fileInputRef as React.RefObject<HTMLInputElement>}
              onFileChange={state.scanImage}
            />

            <RouteList
              points={state.routePoints}
              isOptimized={state.isOptimized}
              onRemove={state.removePoint}
            />

            <NavigationPanel
              hasPoints={state.routePoints.length > 0}
              hasMultiple={state.routePoints.length > 1}
              onOptimize={state.optimize}
              onWaze={state.openWaze}
              onGoogleMaps={state.openGoogleMaps}
            />
          </div>

          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <RouteMap
              points={state.routePoints}
              isOptimized={state.isOptimized}
              isProcessing={state.isProcessing}
            />
            <RouteStats
              points={state.routePoints}
              isOptimized={state.isOptimized}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
