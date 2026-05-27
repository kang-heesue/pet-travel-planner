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
  const [isSearching, setIsSearching] = React.useState(false);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (!window.visualViewport) return;
    const handleResize = () => {
      const kh = window.innerHeight - window.visualViewport.height;
      const currentKeyboardHeight = kh > 50 ? kh : 0;
      setKeyboardHeight(currentKeyboardHeight);

      // 키보드가 내려가서 높이가 0이 되었는데, input 포커스가 여전히 유지되어 있으면 강제로 blur 처리하여 토글을 복원
      if (currentKeyboardHeight === 0) {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          activeEl.blur();
        }
      }
    };
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    handleResize();
    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
      window.visualViewport.removeEventListener('scroll', handleResize);
    };
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

        {/* 모바일 검색창 단독 영역 (조건 재설정 아래 배치) */}
        {isMobile && !isOptimized && (
          <div
            className="glass"
            style={{
              position: 'absolute',
              top: '52px',
              left: '6px',
              right: '46px',
              zIndex: 100,
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: 'var(--shadow-md)',
              background: 'var(--bg-glass)',
              transition: 'all 0.3s ease',
            }}
          >
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="매장 명칭, 동네 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearching(true)}
              onBlur={() => setTimeout(() => setIsSearching(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
              }}
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
            isSearching={isSearching}
            keyboardHeight={keyboardHeight}
          />
        )}
      </div>

      {/* 2. 우측 사이드바 */}
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
        isSearching={isSearching}
      />

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
