import React, { useState, useEffect } from 'react';
import { parseCSV } from './utils/csvParser';
import { optimizeSchedule } from './utils/optimizer';
import SetupPage from './pages/SetupPage';
import PlanPage from './pages/PlanPage';

// 각 대표 지역별 기본 KTX역/터미널 추천 랜드마크 데이터셋
const RECOMMENDED_LANDMARKS = {
  '부산': [
    { name: '부산역 (KTX)', lat: 35.1152, lng: 129.0422 },
    { name: '광안리 해수욕장', lat: 35.1531, lng: 129.1189 },
    { name: '해운대 엘시티', lat: 35.1585, lng: 129.1668 },
    { name: '김해국제공항', lat: 35.1795, lng: 128.9382 }
  ],
  '강릉': [
    { name: '강릉역 (KTX)', lat: 37.7638, lng: 128.8995 },
    { name: '안목 커피거리', lat: 37.7726, lng: 128.9473 },
    { name: '경포대 해변', lat: 37.8023, lng: 128.9110 },
    { name: '주문진항', lat: 37.8922, lng: 128.8302 }
  ],
  '속초': [
    { name: '속초고속버스터미널', lat: 38.1901, lng: 128.6019 },
    { name: '속초 관광수산시장', lat: 38.2039, lng: 128.5905 },
    { name: '설악산 케이블카', lat: 38.1732, lng: 128.4871 }
  ],
  '춘천': [
    { name: '춘천역 (경춘선)', lat: 37.8848, lng: 127.7170 },
    { name: '남이섬 선착장', lat: 37.7901, lng: 127.5261 },
    { name: '소양강 스카이워크', lat: 37.8943, lng: 127.7258 }
  ],
  '원주': [
    { name: '원주역 (중앙선)', lat: 37.3190, lng: 127.9255 },
    { name: '뮤지엄 산', lat: 37.4287, lng: 127.7925 },
    { name: '소금산 출렁다리', lat: 37.3622, lng: 127.8185 }
  ],
  '양양': [
    { name: '양양종합여객터미널', lat: 38.0743, lng: 128.6212 },
    { name: '낙산사', lat: 38.1252, lng: 128.6288 },
    { name: '서피비치', lat: 38.0277, lng: 128.7175 }
  ],
  '영월': [
    { name: '영월역', lat: 37.1822, lng: 128.4745 },
    { name: '한반도지형 전망대', lat: 37.2213, lng: 128.3454 },
    { name: '동강 생태공원', lat: 37.2025, lng: 128.4905 }
  ],
  '평창': [
    { name: '평창역 (KTX)', lat: 37.5255, lng: 128.4312 },
    { name: '대관령 하늘목장', lat: 37.7117, lng: 128.7321 },
    { name: '오대산 월정사', lat: 37.7315, lng: 128.5902 }
  ]
};

const DEFAULT_COORDS = { name: '대한민국 중심지', lat: 37.5665, lng: 126.9780 };

const REGION_API_CODES = {
  '서울': '1', '인천': '2', '대전': '3', '대구': '4', '광주': '5', '부산': '6', '울산': '7', '세종': '8',
  '경기': '31', '강원': '32', '충북': '33', '충남': '34', '경북': '35', '경남': '36', '전북': '37', '전남': '38', '제주': '39',
  '강릉': '32', '속초': '32', '춘천': '32', '원주': '32', '양양': '32', '영월': '32', '평창': '32', '고성': '32', '삼척': '32', '홍천': '32'
};

export default function App() {
  // --- 상태 정의 (States) ---
  const [step, setStep] = useState('setup'); // 'setup' | 'plan'
  
  // 데이터셋 관련
  const [allPlaces, setAllPlaces] = useState([]);
  const [places, setPlaces] = useState([]); 
  const [availableRegions, setAvailableRegions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 실시간 공공 API 연동 메타데이터 상태
  const [apiLoadStatus, setApiLoadStatus] = useState('idle'); // 'idle' | 'fetching' | 'success' | 'fallback_used'
  const [liveApiCount, setLiveApiCount] = useState(0);

  // 셋업 파라미터 상태
  const [regionInput, setRegionInput] = useState('부산');
  const [selectedRegion, setSelectedRegion] = useState('부산');
  const [showRegionSuggestions, setShowRegionSuggestions] = useState(false);

  // 시작 중심지 검색 & 후보군 상태
  const [startSearchInput, setStartSearchInput] = useState('부산역 (KTX)');
  const [startPlaceName, setStartPlaceName] = useState('부산역 (KTX)');
  const [startCoords, setStartCoords] = useState({ lat: 35.1152, lng: 129.0422 });
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [startSuggestions, setStartSuggestions] = useState([]);

  // 여행 기간 날짜 상태
  const [startDate, setStartDate] = useState('2026-05-16');
  const [endDate, setEndDate] = useState('2026-05-18');

  // 일정 계획용 메인 상태
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [cart, setCart] = useState([]);

  // 최적화 생성 일정 관련
  const [isOptimized, setIsOptimized] = useState(false);
  const [optimizedSchedule, setOptimizedSchedule] = useState({});
  const [activeDayTab, setActiveDayTab] = useState('Day 1');

  // --- 1. CSV 로컬 캐시 데이터 페칭 (최초 1회 실행) ---
  useEffect(() => {
    const loadCSVData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/데이터.csv');
        if (!response.ok) throw new Error("CSV 데이터 로드 실패");
        
        const text = await response.text();
        const parsed = parseCSV(text);
        
        setAllPlaces(parsed);

        // 고유 지역명 목록 정렬 추출
        const regions = Array.from(new Set(parsed.map(item => item.region)))
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, 'ko'));
        
        setAvailableRegions(regions);

        // 기본 부산 지역 데이터셋 바인딩
        const busanPlaces = parsed.filter(item => item.region === '부산');
        setPlaces(busanPlaces);
        setIsLoading(false);
      } catch (err) {
        console.error("CSV 로드 에러 발생:", err);
        setIsLoading(false);
      }
    };
    loadCSVData();
  }, []);

  // --- 2. 실시간 공공 API 연동 및 로컬 폴백 (하이브리드 스왑) ---
  const fetchLivePetTourData = async (regionName) => {
    const areaCode = REGION_API_CODES[regionName] || '32';
    const serviceKey = '3659087dc19dc9a8d6764c4ee50be1ce77aeb5816b6562ce997cc0c754fa5529';
    const liveApiUrl = `https://apis.data.go.kr/B551011/KorPetTourService2/areaBasedList2?serviceKey=${serviceKey}&numOfRows=40&pageNo=1&MobileOS=ETC&MobileApp=PetPlanner&_type=json&areaCode=${areaCode}`;
    
    console.log(`[API REQUEST] 실시간 호출 시도: ${liveApiUrl}`);
    setApiLoadStatus('fetching');
    
    // 방어 로직: 지역 변경 시 이전 지역의 마커들이 임시로 잔존해 피팅 오차를 범하는 것을 원천 차단하기 위해 places를 비움
    setPlaces([]);

    try {
      const response = await fetch(liveApiUrl);
      if (!response.ok) throw new Error("네트워크 응답 이상");

      const data = await response.json();
      const items = data?.response?.body?.items?.item || [];

      if (items.length > 0) {
        const mappedLivePlaces = items.map((item, idx) => {
          let mappedCategory = 'tourist';
          if (item.contenttypeid === '39') mappedCategory = item.title.includes('카페') ? 'cafe' : 'restaurant';
          if (item.contenttypeid === '32') mappedCategory = 'hotel';

          return {
            id: `live-api-${item.contentid || idx}`,
            name: item.title,
            region: regionName,
            address: item.addr1 || '상세 주소 없음',
            category: mappedCategory,
            lat: parseFloat(item.mapy) || startCoords.lat,
            lng: parseFloat(item.mapx) || startCoords.lng,
            phone: item.tel || '정보 없음',
            homepage: '',
            pet_rule: '한국관광공사 승인 동반 가능 업소',
            description: `공공 API 실시간 정보: 반려견과 동반 방문이 공식 인가된 소중한 동반처입니다.`,
            open_hours: mappedCategory === 'hotel' ? '체크인 15:00 / 아웃 11:00' : '11:00 - 21:00'
          };
        });

        // 비동기 경쟁상태(Race Condition) 방어: 사용자가 그새 다른 지역으로 넘겼다면 무시
        setSelectedRegion(currentRegion => {
          if (currentRegion === regionName) {
            setPlaces(mappedLivePlaces);
            setLiveApiCount(mappedLivePlaces.length);
            setApiLoadStatus('success');
          }
          return currentRegion;
        });
      } else {
        throw new Error("조회된 실시간 정보 부재");
      }
    } catch (err) {
      console.warn(`[CORS / NETWORK BLOCK] 공공 API 통신 차단으로 로컬 안전 캐시 DB 스와핑:`, err);
      // 폴백 시에도 경쟁상태 방어 작동
      setSelectedRegion(currentRegion => {
        if (currentRegion === regionName) {
          const localFiltered = allPlaces.filter(p => p.region === regionName);
          setPlaces(localFiltered);
          setLiveApiCount(0);
          setApiLoadStatus('fallback_used');
        }
        return currentRegion;
      });
    }
  };

  // --- 3. 지역 변경 트리거 핸들러 ---
  const handleRegionChange = (region) => {
    setSelectedRegion(region);
    setRegionInput(region);
    setShowRegionSuggestions(false);
    setCart([]);
    handleResetSchedule();

    const landmarks = getStartCandidates(region);
    let selectedLandmark = DEFAULT_COORDS;

    if (landmarks.length > 0) {
      selectedLandmark = landmarks[0];
    } else {
      const regionPlaces = allPlaces.filter(p => p.region === region);
      if (regionPlaces.length > 0) {
        selectedLandmark = { name: `${region} 중심지`, lat: regionPlaces[0].lat, lng: regionPlaces[0].lng };
      }
    }

    setStartPlaceName(selectedLandmark.name);
    setStartSearchInput(selectedLandmark.name);
    setStartCoords({ lat: selectedLandmark.lat, lng: selectedLandmark.lng });

    // 실시간 한국관광공사 데이터 갱신 기동
    fetchLivePetTourData(region);
  };

  // 대표 시작 중심지 후보군 동적 추출
  const getStartCandidates = (region = selectedRegion) => {
    if (RECOMMENDED_LANDMARKS[region]) {
      return RECOMMENDED_LANDMARKS[region];
    }
    const regionPlaces = allPlaces.filter(p => p.region === region);
    const tourists = regionPlaces.filter(p => p.category === 'tourist').slice(0, 4);
    if (tourists.length > 0) {
      return tourists.map(t => ({ name: t.name, lat: t.lat, lng: t.lng }));
    }
    return regionPlaces.slice(0, 4).map(t => ({ name: t.name, lat: t.lat, lng: t.lng }));
  };

  // 시작지 검색 입력 매칭 필터링 (카카오 공식 지도 키워드 검색 서비스 API 결합)
  useEffect(() => {
    if (!startSearchInput || startSearchInput === startPlaceName) {
      setStartSuggestions([]);
      return;
    }

    // 1. 카카오 지도 SDK 및 장소 검색 서비스가 로드되었을 경우: 공식 실시간 로컬 API 기동!
    if (window.kakao && window.kakao.maps && window.kakao.maps.services && window.kakao.maps.services.Places) {
      try {
        const ps = new window.kakao.maps.services.Places();
        
        // 검색 범위를 사용자가 선택한 대표 지역으로 좁히기 위해 키워드 조합 (예: "강릉 강릉역")
        const searchKeyword = `${selectedRegion} ${startSearchInput}`;
        
        ps.keywordSearch(searchKeyword, (data, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const kakaoMatches = data.slice(0, 5).map(item => ({
              name: item.place_name,
              lat: parseFloat(item.y),
              lng: parseFloat(item.x),
              address: item.road_address_name || item.address_name
            }));
            setStartSuggestions(kakaoMatches);
          }
        });
        return;
      } catch (err) {
        console.warn("Kakao Local Keyword Search failed, falling back to local dataset:", err);
      }
    }

    // 2. 카카오 SDK 미로드 시 (보안/오프라인 환경): 기존 정제 CSV 로컬 폴백 매칭!
    const currentRegionPlaces = allPlaces.filter(p => p.region === selectedRegion);
    const combinedSources = [...places, ...currentRegionPlaces];
    
    // 명칭 중복 제거
    const uniquePlaces = [];
    const seenNames = new Set();
    for (const p of combinedSources) {
      if (!seenNames.has(p.name)) {
        seenNames.add(p.name);
        uniquePlaces.push(p);
      }
    }

    const matches = uniquePlaces
      .filter(p => p.name.toLowerCase().includes(startSearchInput.toLowerCase()))
      .slice(0, 5)
      .map(p => ({ name: p.name, lat: p.lat, lng: p.lng }));

    setStartSuggestions(matches);
  }, [startSearchInput, places, allPlaces, selectedRegion, startPlaceName]);

  const handleSelectStartPlace = (landmark) => {
    setStartPlaceName(landmark.name);
    setStartSearchInput(landmark.name);
    setStartCoords({ lat: landmark.lat, lng: landmark.lng });
    setShowStartSuggestions(false);
    handleResetSchedule();
  };

  // --- 4. 최적화 제어 핸들러 ---
  const handleOptimizeSchedule = () => {
    if (cart.length === 0) return;
    
    // 여행 일수 계산
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const daysCount = (Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1) || 1;

    const result = optimizeSchedule(cart, daysCount, startCoords, startPlaceName);
    setOptimizedSchedule(result);
    setIsOptimized(true);
    setActiveDayTab('Day 1');
  };

  const handleResetSchedule = () => {
    setIsOptimized(false);
    setOptimizedSchedule({});
  };

  const handleToggleCart = (place) => {
    if (cart.some(item => item.id === place.id)) {
      setCart(cart.filter(item => item.id !== place.id));
    } else {
      setCart([...cart, place]);
    }
  };

  // 카테고리 & 검색어 매핑 장소 필터링
  const getFilteredPlaces = () => {
    if (!places) return [];
    return places.filter(place => {
      const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
      const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            place.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  // --- 5. 안전 로딩 스피너 스크린 ---
  if (isLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-base)',
        gap: '16px'
      }}>
        <div style={{
          border: '4px solid var(--border)',
          borderTop: '4px solid var(--primary)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'pulse-subtle 1.5s infinite linear'
        }}></div>
        <p style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '15px' }}>
          🐶 전국 반려견 동반 가능 지도 로드 중...
        </p>
      </div>
    );
  }

  // --- 6. 스위칭 라우터 기동 ---
  return (
    <div className="app-container">
      {step === 'setup' && (
        <SetupPage
          regionInput={regionInput}
          setRegionInput={setRegionInput}
          selectedRegion={selectedRegion}
          showRegionSuggestions={showRegionSuggestions}
          setShowRegionSuggestions={setShowRegionSuggestions}
          availableRegions={availableRegions}
          handleRegionChange={handleRegionChange}
          startSearchInput={startSearchInput}
          setStartSearchInput={setStartSearchInput}
          startPlaceName={startPlaceName}
          showStartSuggestions={showStartSuggestions}
          setShowStartSuggestions={setShowStartSuggestions}
          startSuggestions={startSuggestions}
          handleSelectStartPlace={handleSelectStartPlace}
          getStartCandidates={getStartCandidates}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          handleResetSchedule={handleResetSchedule}
          onStartPlanning={() => setStep('plan')}
        />
      )}

      {step === 'plan' && (
        <PlanPage
          selectedRegion={selectedRegion}
          startDate={startDate}
          endDate={endDate}
          startPlaceName={startPlaceName}
          startCoords={startCoords}
          apiLoadStatus={apiLoadStatus}
          liveApiCount={liveApiCount}
          filteredPlaces={getFilteredPlaces()}
          selectedPlace={selectedPlace}
          setSelectedPlace={setSelectedPlace}
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
          handleToggleCart={handleToggleCart}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onBackToSetup={() => {
            setStep('setup');
            handleResetSchedule();
          }}
        />
      )}
    </div>
  );
}
