import React from 'react';
import { ArrowLeft, RotateCcw, Search } from 'lucide-react';
import KakaoMap from '../components/KakaoMap';
import ItinerarySidebar from '../components/ItinerarySidebar';
import PlaceCardCarousel from '../components/PlaceCardCarousel';
import PlaceDetailModal from '../components/PlaceDetailModal';

export default function PlanPage({
  selectedRegion,
  startDate,
  endDate,
  startPlaceName,
  startCoords,
  apiLoadStatus,
  liveApiCount,
  filteredPlaces,
  allFilteredPlaces,
  selectedPlace,
  setSelectedPlace,
  cart,
  setCart,
  searchQuery,
  setSearchQuery,
  isOptimized,
  optimizedSchedule,
  activeDayTab,
  setActiveDayTab,
  handleOptimizeSchedule,
  handleResetSchedule,
  handleToggleCart,
  selectedCategory,
  setSelectedCategory,
  onBackToSetup,
}) {
  const [isSidebarExpanded, setIsSidebarExpanded] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 여행 일수 계산
  const getTravelDaysCount = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays || 1;
  };

  return (
    <>
      {/* 1. 맵 & 카드 영역 */}
      <div
        className="main-map-area"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          height: '100%',
        }}
      >
        {/* 상단 헤더 */}
        <div
          className="glass plan-header-banner"
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '50px',
            zIndex: 100,
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {isOptimized ? (
            /* 1) 장소 추가/수정 버튼 */
            <button
              onClick={handleResetSchedule}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700,
                color: 'white',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--secondary)',
                border: 'none',
              }}
              className="interactive"
            >
              <ArrowLeft size={14} />
              <span>장소 추가/수정</span>
            </button>
          ) : (
            /* 2) 조건 재설정 버튼 */
            <button
              onClick={onBackToSetup}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--primary)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-light)',
              }}
              className="interactive"
            >
              <ArrowLeft size={14} />
              <span>조건 재설정</span>
            </button>
          )}

            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: 'var(--text-main)',
              }}
            >
              📍 {selectedRegion} 여행 ({getTravelDaysCount()}일간)
            </span>
        </div>

        {/* 모바일 장소 탐색 중 상단 고정 검색바 */}
        {!isOptimized && isMobile && (
          <div
            className="glass"
            style={{
              position: 'absolute',
              top: '52px',
              left: '6px',
              right: '6px',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-glass)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Search size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="매장 명칭, 동네 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-main)',
              }}
            />
          </div>
        )}

        {/* 카카오 지도 */}
        <div
          className="map-wrapper"
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          <KakaoMap
            startCoords={startCoords}
            startPlaceName={startPlaceName}
            filteredPlaces={allFilteredPlaces || filteredPlaces}
            selectedPlace={selectedPlace}
            setSelectedPlace={setSelectedPlace}
            cart={cart}
            isOptimized={isOptimized}
            optimizedSchedule={optimizedSchedule}
            activeDayTab={activeDayTab}
            selectedRegion={selectedRegion}
          />
        </div>

        {/* 하단 카테고리 슬라이더 */}
        {!isOptimized && (
          <PlaceCardCarousel
            filteredPlaces={filteredPlaces}
            selectedPlace={selectedPlace}
            setSelectedPlace={setSelectedPlace}
            cart={cart}
            handleToggleCart={handleToggleCart}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            handleOptimizeSchedule={handleOptimizeSchedule}
          />
        )}
      </div>

      {/* 2. 우측 사이드바 */}
      {(!isMobile || isOptimized) && (
        <ItinerarySidebar
          cart={cart}
          setCart={setCart}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isOptimized={isOptimized}
          optimizedSchedule={optimizedSchedule}
          activeDayTab={activeDayTab}
          setActiveDayTab={setActiveDayTab}
          handleOptimizeSchedule={handleOptimizeSchedule}
          handleResetSchedule={handleResetSchedule}
          selectedPlace={selectedPlace}
          setSelectedPlace={setSelectedPlace}
          startPlaceName={startPlaceName}
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
        />
      )}

      {/* 3. 상세 모달 */}
      <PlaceDetailModal
        selectedPlace={selectedPlace}
        setSelectedPlace={setSelectedPlace}
        cart={cart}
        handleToggleCart={handleToggleCart}
      />
    </>
  );
}
