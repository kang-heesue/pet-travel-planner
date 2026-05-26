import React, { useEffect, useRef, useState } from 'react';
import { Compass, MapPin } from 'lucide-react';
import { getDistance } from '../utils/optimizer';

export default function KakaoMap({
  startCoords,
  startPlaceName,
  filteredPlaces,
  selectedPlace,
  setSelectedPlace,
  cart,
  isOptimized,
  optimizedSchedule,
  activeDayTab,
  selectedRegion,
}) {
  const mapContainerRef = useRef(null);
  const kakaoMapInstance = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const isInitialFitRef = useRef({}); // 최초 Bounds 피팅 여부 추적 레프
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // 1. 지도 초기화
  useEffect(() => {
    let checkCount = 0;

    const tryInitMap = () => {
      if (window.kakao && window.kakao.maps) {
        try {
          if (!mapContainerRef.current) return;

          const container = mapContainerRef.current;
          const centerCoords = startCoords || { lat: 37.5665, lng: 126.978 };
          const options = {
            center: new window.kakao.maps.LatLng(
              centerCoords.lat,
              centerCoords.lng,
            ),
            level: 7, // 기본 줌 레벨 설정
          };

          const map = new window.kakao.maps.Map(container, options);
          kakaoMapInstance.current = map;

          const zoomControl = new window.kakao.maps.ZoomControl();
          map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

          setMapLoaded(true);
          setLoadError(false);
          clearInterval(pollerInterval);
        } catch (err) {
          console.error('Failed to initialize Kakao Map:', err);
          setLoadError(true);
          clearInterval(pollerInterval);
        }
      } else {
        checkCount++;
        // SDK 로드 감시 폴링 (최대 5초)
        if (checkCount >= 10) {
          console.warn(
            'Kakao maps SDK is not loaded on window object. Timeout reached.',
          );
          setLoadError(true);
          clearInterval(pollerInterval);
        }
      }
    };
    const pollerInterval = setInterval(tryInitMap, 500);
    tryInitMap();

    return () => {
      clearInterval(pollerInterval);
    };
  }, [startCoords]);

  // 2. 마커 및 Polyline 렌더링
  useEffect(() => {
    if (!mapLoaded || !kakaoMapInstance.current) return;

    const map = kakaoMapInstance.current;

    // 마커 및 오버레이 초기화
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    const pathCoordinates = [];
    const centerCoords = startCoords || { lat: 37.5665, lng: 126.978 };

    // --- CASE A. AI 최적 일정 동선 뷰 ---
    if (isOptimized && optimizedSchedule[activeDayTab]) {
      const activePlaces = (optimizedSchedule[activeDayTab] || []).filter(
        (item) => item.id !== 'last-day-end-node'
      );

      activePlaces.forEach((item, index) => {
        const markerPosition = new window.kakao.maps.LatLng(item.lat, item.lng);
        pathCoordinates.push(markerPosition);

        // 이전 노드가 존재하면 노드 간 거리를 계산해 텍스트 배지(CustomOverlay) 출력
        if (index > 0) {
          const prevItem = activePlaces[index - 1];
          const distVal = getDistance(
            prevItem.lat,
            prevItem.lng,
            item.lat,
            item.lng,
          );
          
          // 거리가 0m거나 극도로 미세한 동일/근접 노드(10m 미만)일 때는 0m 배지를 렌더링하지 않고 스킵!
          if (distVal > 0.01) {
            const distanceStr =
              distVal < 1
                ? `${Math.round(distVal * 1000)}m`
                : `${distVal.toFixed(1)}km`;

            const midLat = (prevItem.lat + item.lat) / 2;
            const midLng = (prevItem.lng + item.lng) / 2;
            const midPosition = new window.kakao.maps.LatLng(midLat, midLng);

            const distanceOverlayContent = `
              <div style="
                background: white;
                color: #2d3748;
                font-family: 'Outfit', sans-serif;
                font-weight: 800;
                font-size: 10px;
                padding: 4px 8px;
                border-radius: 9999px;
                border: 1.5px solid #e07a5f;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                white-space: nowrap;
                transform: translate(-50%, -50%);
                pointer-events: none;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
              ">
                🚗 ${distanceStr}
              </div>
            `;

            const distanceOverlay = new window.kakao.maps.CustomOverlay({
              position: midPosition,
              content: distanceOverlayContent,
              xAnchor: 0.5,
              yAnchor: 0.5,
            });
            distanceOverlay.setMap(map);
            markersRef.current.push(distanceOverlay);
          }
        }

        // 커스텀 배지 마커 렌더링
        const isStartNode = item.id === 'start-landmark-node';
        
        let bgColor = '#4e79a7';
        if (isStartNode) {
          bgColor = '#e8927c'; // 연해진 시작 살구/다홍색 테마 컬러
        } else if (item.category === 'hotel') {
          bgColor = '#59a14f';
        } else if (item.category === 'restaurant') {
          bgColor = '#e15759';
        } else if (item.category === 'cafe') {
          bgColor = '#f28e2b';
        }

        const el = document.createElement('div');
        el.style.background = bgColor;
        el.style.color = 'white';
        el.style.fontFamily = "'Outfit', sans-serif";
        el.style.fontWeight = '850';
        el.style.fontSize = '12px';
        el.style.width = '26px';
        el.style.height = '26px';
        el.style.borderRadius = '50%';
        el.style.border = '2.5px solid white';
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.cursor =
          item.id === 'start-landmark-node' ? 'default' : 'pointer';
        el.style.transform = 'scale(1)';
        el.style.transition = 'all 0.2s ease-in-out';

        // 마우스 호버 효과
        if (item.id !== 'start-landmark-node') {
          el.onmouseenter = () => {
            el.style.transform = 'scale(1.2)';
            el.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35)';
          };
          el.onmouseleave = () => {
            el.style.transform = 'scale(1)';
            el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
          };
        }

        // 시작 노드 🏁 표출
        if (isStartNode) {
          el.innerHTML = '🏁';
          el.style.fontSize = '12px';
        } else {
          el.innerHTML = activeDayTab === 'Day 1' ? index : index + 1;
        }

        // 클릭 이벤트
        if (item.id !== 'start-landmark-node') {
          el.addEventListener('click', () => {
            setSelectedPlace(item);
            map.panTo(markerPosition);
          });
        }

        const customOverlay = new window.kakao.maps.CustomOverlay({
          position: markerPosition,
          content: el,
          clickable: true,
          xAnchor: 0.5,
          yAnchor: 0.5,
        });
        customOverlay.setMap(map);
        markersRef.current.push(customOverlay);
      });

      // 경로 연결선(Polyline) 그리기
      if (pathCoordinates.length > 1) {
        const polyline = new window.kakao.maps.Polyline({
          path: pathCoordinates,
          strokeWeight: 5,
          strokeColor: '#e07a5f',
          strokeOpacity: 0.85,
          strokeStyle: 'solid',
        });
        polyline.setMap(map);
        polylineRef.current = polyline;
      }

      // 지도 영역 맞춤
      const optimizeKey = `optimized-${activeDayTab}-${selectedRegion || 'default'}`;
      if (isInitialFitRef.current[optimizeKey] === undefined) {
        if (pathCoordinates.length > 0) {
          const bounds = new window.kakao.maps.LatLngBounds();
          pathCoordinates.forEach((pos) => bounds.extend(pos));
          
          // 모바일 여백 보정
          const isMobile = window.innerWidth <= 768;
          const paddingTop = isMobile ? 80 : 40;
          const paddingRight = isMobile ? 40 : 40;
          const paddingBottom = isMobile ? Math.floor(window.innerHeight * 0.63) : 40;
          const paddingLeft = isMobile ? 40 : 40;
          
          map.setBounds(bounds, paddingTop, paddingRight, paddingBottom, paddingLeft);
          isInitialFitRef.current[optimizeKey] = true;
        }
      }
      return;
    }

    // --- CASE B. 일반 탐색 및 편집 상태 ---
    // 1. 출발지 마커
    const startPos = new window.kakao.maps.LatLng(
      centerCoords.lat,
      centerCoords.lng,
    );
    const startMarker = new window.kakao.maps.Marker({
      position: startPos,
      map: map,
      title: `출발지: ${startPlaceName}`,
    });

    // 인포윈도우 장착
    const startInfowindow = new window.kakao.maps.InfoWindow({
      content: `<div style="padding:5px; font-size:11px; font-weight:700; color:#2d3748;">🏁 ${startPlaceName}</div>`,
    });
    startInfowindow.open(map, startMarker);
    markersRef.current.push(startMarker);
    markersRef.current.push(startInfowindow);

    // LatLngBounds 계산
    const bounds = new window.kakao.maps.LatLngBounds();
    bounds.extend(startPos);

    let validPlacesCount = 0;

    // 2. 장소 마커 (좌표+이름 유사도 기반 정밀 중복 제거)
    // 좌표가 같아도 이름이 다르면 별도 장소로 취급
    const normalize = (s) => s.replace(/[\s\-·_]/g, '').toLowerCase();
    const seenPlaces = new Map(); // coordKey -> [normalized names]
    filteredPlaces.forEach((place) => {
      const coordKey = `${parseFloat(place.lat).toFixed(4)},${parseFloat(place.lng).toFixed(4)}`;
      const normName = normalize(place.name);
      const existing = seenPlaces.get(coordKey) || [];
      // 어느 한쪽이 다른 쪽 이름을 포함하면 중복으로 판단
      const isDuplicate = existing.some(
        (n) => n.includes(normName) || normName.includes(n)
      );
      if (isDuplicate) return;
      existing.push(normName);
      seenPlaces.set(coordKey, existing);

      const position = new window.kakao.maps.LatLng(place.lat, place.lng);
      
      // 선택 지역 기준 bounds 연장
      const normRegion = selectedRegion ? selectedRegion.replace(/(시|군|구|도|특별자치도)$/, '').trim() : '';
      const isCurrentRegion = !selectedRegion || place.region.includes(normRegion) || place.address.includes(normRegion);
      
      if (isCurrentRegion) {
        bounds.extend(position);
        validPlacesCount++;
      }

      // 장바구니 포함 여부 확인
      const cleanPlaceId = (id) => typeof id === 'string' && id.includes('-hotel-') ? id.split('-hotel-')[1] : id;
      const isCarted = cart.some(item => cleanPlaceId(item.id) === cleanPlaceId(place.id));

      // 카테고리 테마 및 이모지
      let bgColor = '#4e79a7'; // 관광지 기본 (인디고 블루)
      let emoji = '🏞️';

      if (place.category === 'hotel') {
        bgColor = '#59a14f';
        emoji = '🏠';
      } else if (place.category === 'restaurant') {
        bgColor = '#e15759';
        emoji = '🍽️';
      } else if (place.category === 'cafe') {
        bgColor = '#f28e2b';
        emoji = '☕';
      }

      const el = document.createElement('div');
      el.style.fontFamily = "'Outfit', sans-serif";
      el.style.borderRadius = '50%';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.2s ease-in-out';

      // 관심 일정 마커 디자인
      if (isCarted) {
        el.style.background = bgColor; 
        el.style.border = '2.5px solid #ff4d6d'; 
        el.style.transform = 'translateY(-12px) scale(1.15)'; 
        el.style.width = '28px';
        el.style.height = '28px';
        el.style.fontSize = '12px';
        el.style.boxShadow = '0 6px 14px rgba(255, 77, 109, 0.4)';
        el.innerHTML = '❤️';
      } else {
        el.style.background = bgColor;
        el.style.border = '2.5px solid white';
        el.style.transform = 'translateY(-10px) scale(1)';
        el.style.width = '26px';
        el.style.height = '26px';
        el.style.fontSize = '12px';
        el.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
        el.innerHTML = emoji;
      }

      // 호버 이펙트
      el.onmouseenter = () => {
        el.style.transform = isCarted ? 'translateY(-16px) scale(1.25)' : 'translateY(-14px) scale(1.15)';
        el.style.boxShadow = isCarted ? '0 8px 20px rgba(255, 77, 109, 0.65)' : '0 6px 14px rgba(0,0,0,0.3)';
      };
      el.onmouseleave = () => {
        el.style.transform = isCarted ? 'translateY(-12px) scale(1.15)' : 'translateY(-10px) scale(1)';
        el.style.boxShadow = isCarted ? '0 6px 14px rgba(255, 77, 109, 0.4)' : '0 4px 10px rgba(0,0,0,0.2)';
      };

      el.title = `${place.name} (${place.category === 'hotel' ? '숙소' : place.category === 'restaurant' ? '식당' : place.category === 'cafe' ? '카페' : '관광지'})${isCarted ? ' [관심 등록됨]' : ''}`;

      el.addEventListener('click', () => {
        setSelectedPlace(place);
        map.panTo(position);
      });

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: el,
        clickable: true,
        yAnchor: 1,
      });

      customOverlay.setMap(map);
      markersRef.current.push(customOverlay);
    });

    // 영역 자동 피팅
    const regionKey = `${selectedRegion || 'default'}-${centerCoords.lat}-${centerCoords.lng}`;

    if (isInitialFitRef.current[regionKey] === undefined) {
      if (isOptimized) {
        // AI 최적화 모드 전체 경로 피팅
        if (validPlacesCount > 0) {
          map.setBounds(bounds);
        } else {
          map.setCenter(startPos);
          map.setLevel(7);
        }
      } else {
        // 최초 진입 포커싱
        map.setCenter(startPos);
        map.setLevel(7);
      }
      isInitialFitRef.current[regionKey] = true;
    }
  }, [
    mapLoaded,
    startCoords,
    filteredPlaces,
    isOptimized,
    optimizedSchedule,
    activeDayTab,
    selectedRegion,
    cart,
  ]);

  // 3. 외부 선택 장소 무빙
  useEffect(() => {
    if (!mapLoaded || !kakaoMapInstance.current || !selectedPlace) return;
    const position = new window.kakao.maps.LatLng(
      selectedPlace.lat,
      selectedPlace.lng,
    );
    kakaoMapInstance.current.panTo(position);
  }, [mapLoaded, selectedPlace]);

  // --- 에러 UI ---
  if (loadError) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f7f6f2',
          padding: '24px',
          textAlign: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          🗺️
        </div>
        <div>
          <h3
            style={{
              fontWeight: 800,
              fontSize: '16px',
              color: 'var(--text-main)',
            }}
          >
            카카오 공식 지도 로드 대기 중
          </h3>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '8px',
              lineHeight: '1.6',
              maxWidth: '320px',
              margin: '8px auto 0 auto',
            }}
          >
            카카오 SDK 스크립트 연결을 점검하고 있습니다.
            <br />
            지속해서 지도가 보이지 않는다면 Kakao Developers 플랫폼의 앱 키와
            도메인(
            <code
              style={{
                background: '#e2e8f0',
                padding: '2px 4px',
                borderRadius: '4px',
              }}
            >
              localhost:3000
            </code>
            ) 등록을 확인해 주세요.
          </p>
        </div>
      </div>
    );
  }

  // --- 정식 지도 렌더러 컨테이너 ---
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#ebf4f6',
        }}
      ></div>
      {!mapLoaded && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(253, 250, 247, 0.85)',
            gap: '12px',
            zIndex: 10,
          }}
        >
          <div
            style={{
              border: '3px solid var(--border)',
              borderTop: '3px solid var(--primary)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              animation: 'pulse-subtle 1.5s infinite linear',
            }}
          ></div>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-muted)',
            }}
          >
            카카오 지도를 활성화하고 있습니다...
          </p>
        </div>
      )}
    </div>
  );
}
