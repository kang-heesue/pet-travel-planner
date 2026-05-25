import React from 'react';
import { ArrowLeft } from 'lucide-react';
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
  onBackToSetup
}) {
  
  // 날짜 간 차이(일수) 계산 함수
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
      {/* 1. 좌측 메인 맵 & 카드 목록 영역 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', height: '100%' }}>
        
        {/* 상단 컨트롤 배너 헤더 */}
        <div className="glass" style={{
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
          boxShadow: 'var(--shadow-md)'
        }}>
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
              background: 'var(--primary-light)'
            }}
            className="interactive"
          >
            <ArrowLeft size={14} />
            <span>조건 재설정</span>
          </button>

          {/* 실시간 공공 API 로딩 상태 인디케이터 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 
                apiLoadStatus === 'success' ? 'var(--secondary-light)' :
                apiLoadStatus === 'fallback_used' ? '#f0eae1' : '#f7ebe7',
              color: 
                apiLoadStatus === 'success' ? 'var(--secondary)' :
                apiLoadStatus === 'fallback_used' ? 'var(--text-muted)' : 'var(--primary)',
            }}>
              {apiLoadStatus === 'fetching' && "● 실시간 API 연동 중..."}
              {apiLoadStatus === 'success' && `● 한국관광공사 API 연동 완료 (${liveApiCount}개)`}
              {apiLoadStatus === 'fallback_used' && "● 로컬 안전 정제 DB 연동"}
            </span>
            
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
              📍 {selectedRegion} 여행 ({getTravelDaysCount()}일간)
            </span>
          </div>
        </div>

        {/* 정식 카카오 지도 영역 */}
        <div style={{ 
          flex: 1, 
          width: '100%', 
          height: '100%', 
          position: 'relative'
        }}>
          <KakaoMap
            startCoords={startCoords}
            startPlaceName={startPlaceName}
            filteredPlaces={filteredPlaces}
            selectedPlace={selectedPlace}
            setSelectedPlace={setSelectedPlace}
            cart={cart}
            isOptimized={isOptimized}
            optimizedSchedule={optimizedSchedule}
            activeDayTab={activeDayTab}
            selectedRegion={selectedRegion}
          />
        </div>

        {/* 하단 카테고리 슬라이더: 일정 최적화 결과 보기 모드일 때는 화면의 시인성을 위해 잠시 가려줌 */}
        {!isOptimized && (
          <PlaceCardCarousel
            filteredPlaces={filteredPlaces}
            selectedPlace={selectedPlace}
            setSelectedPlace={setSelectedPlace}
            cart={cart}
            handleToggleCart={handleToggleCart}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        )}
      </div>

      {/* 2. 우측 일정표 타임라인 사이드바 */}
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
      />

      {/* 3. 상세 팝업 정보 모달 */}
      <PlaceDetailModal
        selectedPlace={selectedPlace}
        setSelectedPlace={setSelectedPlace}
        cart={cart}
        handleToggleCart={handleToggleCart}
      />
    </>
  );
}
