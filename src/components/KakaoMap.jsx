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
  selectedRegion
}) {
  const mapContainerRef = useRef(null);
  const kakaoMapInstance = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const isInitialFitRef = useRef({}); // 각 대표 지역/출발지별 최초 1회만 Bounds 자동 피팅하도록 추적하는 레프
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // 1. 지도 초기화 (Vite 비동기 스크립트 지연 극복을 위한 주기적 폴링 감지 적용)
  useEffect(() => {
    let checkCount = 0;
    
    const tryInitMap = () => {
      if (window.kakao && window.kakao.maps) {
        try {
          if (!mapContainerRef.current) return;

          const container = mapContainerRef.current;
          const centerCoords = startCoords || { lat: 37.5665, lng: 126.9780 };
          const options = {
            center: new window.kakao.maps.LatLng(centerCoords.lat, centerCoords.lng),
            level: 8,
          };

          const map = new window.kakao.maps.Map(container, options);
          kakaoMapInstance.current = map;

          const zoomControl = new window.kakao.maps.ZoomControl();
          map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

          setMapLoaded(true);
          setLoadError(false);
          clearInterval(pollerInterval);
        } catch (err) {
          console.error("Failed to initialize Kakao Map:", err);
          setLoadError(true);
          clearInterval(pollerInterval);
        }
      } else {
        checkCount++;
        // 500ms 간격으로 최대 10번(총 5초)까지 대기하며 window 객체에 카카오 맵 SDK가 장착될 때까지 감시합니다.
        if (checkCount >= 10) {
          console.warn("Kakao maps SDK is not loaded on window object. Timeout reached.");
          setLoadError(true);
          clearInterval(pollerInterval);
        }
      }
    };

    // 500ms 주기 폴링 기동
    const pollerInterval = setInterval(tryInitMap, 500);
    
    // 즉시 최초 1회 실행
    tryInitMap();

    return () => {
      clearInterval(pollerInterval);
    };
  }, [startCoords]);

  // 2. 마커 및 Polyline 렌더링 업데이트
  useEffect(() => {
    if (!mapLoaded || !kakaoMapInstance.current) return;

    const map = kakaoMapInstance.current;

    // 기존 마커 및 오버레이 초기화
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    const pathCoordinates = [];
    const centerCoords = startCoords || { lat: 37.5665, lng: 126.9780 };

    // --- CASE A. AI 최적화 동선 뷰 상태 ---
    if (isOptimized && optimizedSchedule[activeDayTab]) {
      const activePlaces = optimizedSchedule[activeDayTab];

      activePlaces.forEach((item, index) => {
        const markerPosition = new window.kakao.maps.LatLng(item.lat, item.lng);
        pathCoordinates.push(markerPosition);

        // 이전 노드가 존재하면, 이전 노드와 현재 노드 간의 동선 거리를 계산하여 정중앙 지점에 예쁜 텍스트 배지(CustomOverlay) 출력
        if (index > 0) {
          const prevItem = activePlaces[index - 1];
          const distVal = getDistance(prevItem.lat, prevItem.lng, item.lat, item.lng);
          const distanceStr = distVal < 1 
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
            yAnchor: 0.5
          });
          distanceOverlay.setMap(map);
          markersRef.current.push(distanceOverlay);
        }

        // 지저분한 기본 파란색 핀 마커 대신, 숫자(1, 2, 3, 4)와 🏁 이모티콘이 예쁘게 담겨 즉시 눈에 띄는 고품격 숫자형 커스텀 핀 배지만 렌더링
        const el = document.createElement('div');
        el.style.background = '#e07a5f';
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
        el.style.cursor = item.id === 'start-landmark-node' ? 'default' : 'pointer';
        el.style.transform = 'translateY(-10px)';
        el.style.transition = 'all 0.2s ease-in-out';
        
        // 마우스 호버 효과 부여
        if (item.id !== 'start-landmark-node') {
          el.onmouseenter = () => {
            el.style.transform = 'translateY(-14px) scale(1.15)';
            el.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35)';
          };
          el.onmouseleave = () => {
            el.style.transform = 'translateY(-10px) scale(1)';
            el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
          };
        }

        el.innerHTML = index + 1;

        // 클릭 이벤트 정합성 바인딩
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
          yAnchor: 1
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
          strokeStyle: 'solid'
        });
        polyline.setMap(map);
        polylineRef.current = polyline;
      }

      // 일정 내 장소들을 한눈에 담도록 지도 영역 맞춤
      if (pathCoordinates.length > 0) {
        const bounds = new window.kakao.maps.LatLngBounds();
        pathCoordinates.forEach(pos => bounds.extend(pos));
        map.setBounds(bounds);
      }
      return;
    }

    // --- CASE B. 일반 탐색 및 편집 상태 ---
    // 1. 여행 시작지 마커 그리기 (빨간 깃발)
    const startPos = new window.kakao.maps.LatLng(centerCoords.lat, centerCoords.lng);
    const startMarker = new window.kakao.maps.Marker({
      position: startPos,
      map: map,
      title: `출발지: ${startPlaceName}`
    });
    
    // 시작점 이름 말풍선 인포윈도우 장착
    const startInfowindow = new window.kakao.maps.InfoWindow({
      content: `<div style="padding:5px; font-size:11px; font-weight:700; color:#2d3748;">🏁 ${startPlaceName}</div>`
    });
    startInfowindow.open(map, startMarker);
    markersRef.current.push(startMarker);
    markersRef.current.push(startInfowindow);

    // 일반 상태 장소 포함 LatLngBounds 계산
    const bounds = new window.kakao.maps.LatLngBounds();
    bounds.extend(startPos);

    let validPlacesCount = 0;

    // 2. 필터링된 장소들 마커 그리기
    filteredPlaces.forEach(place => {
      // 안전 펜스: 선택된 대표 지역(selectedRegion)이 있고, 이와 맞지 않는 타 지역 장소는 뷰포트 피팅 및 마커 생성에서 완전히 제외
      if (selectedRegion && place.region !== selectedRegion) {
        return;
      }

      const position = new window.kakao.maps.LatLng(place.lat, place.lng);
      bounds.extend(position);
      validPlacesCount++;

      const marker = new window.kakao.maps.Marker({
        position: position,
        map: map,
        title: place.name
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedPlace(place);
        map.panTo(position);
      });
      markersRef.current.push(marker);
    });

    // 화면 영역 자동 피팅으로 하단 리스트의 마커들을 무조건 시야 내 노출
    // 단, 담기를 누를 때마다 지도가 줌아웃되며 축소되는 현상을 막기 위해, 대표 지역/중심지별 최초 1회만 setBounds를 작동시킵니다.
    const regionKey = `${selectedRegion || 'default'}-${centerCoords.lat}-${centerCoords.lng}`;
    
    if (isInitialFitRef.current[regionKey] === undefined) {
      if (validPlacesCount > 0) {
        map.setBounds(bounds);
        isInitialFitRef.current[regionKey] = true;
      } else {
        map.setCenter(startPos);
      }
    } else {
      // 그 이후에는 사용자가 설정해 둔 현재 줌 레벨과 맵 중심을 온전히 계속 유지합니다!
    }
  }, [mapLoaded, startCoords, filteredPlaces, isOptimized, optimizedSchedule, activeDayTab, selectedRegion]);

  // 3. 외부 카드 클릭 등에 의한 선택 장소 이동 감지
  useEffect(() => {
    if (!mapLoaded || !kakaoMapInstance.current || !selectedPlace) return;
    const position = new window.kakao.maps.LatLng(selectedPlace.lat, selectedPlace.lng);
    kakaoMapInstance.current.panTo(position);
  }, [mapLoaded, selectedPlace]);

  // --- 에러 플레이스홀더 UI ---
  if (loadError) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f7f6f2',
        padding: '24px',
        textAlign: 'center',
        gap: '16px'
      }}>
        <div style={{
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          boxShadow: 'var(--shadow-sm)'
        }}>🗺️</div>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-main)' }}>카카오 공식 지도 로드 대기 중</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.6', maxWidth: '320px', margin: '8px auto 0 auto' }}>
            카카오 SDK 스크립트 연결을 점검하고 있습니다.<br/>
            지속해서 지도가 보이지 않는다면 Kakao Developers 플랫폼의 앱 키와 도메인(<code style={{background:'#e2e8f0', padding:'2px 4px', borderRadius:'4px'}}>localhost:3000</code>) 등록을 확인해 주세요.
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
          backgroundColor: '#ebf4f6'
        }}
      ></div>
      {!mapLoaded && (
        <div style={{
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
          zIndex: 10
        }}>
          <div style={{
            border: '3px solid var(--border)',
            borderTop: '3px solid var(--primary)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            animation: 'pulse-subtle 1.5s infinite linear'
          }}></div>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>카카오 지도를 활성화하고 있습니다...</p>
        </div>
      )}
    </div>
  );
}
