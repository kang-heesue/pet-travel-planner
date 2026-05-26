import React, { useState, useEffect } from 'react';
import { parseCSV } from './utils/csvParser';
import { optimizeSchedule } from './utils/optimizer';
import SetupPage from './pages/SetupPage';
import PlanPage from './pages/PlanPage';

// 대표 지역별 추천 랜드마크
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
  ],
  '제주': [
    { name: '제주국제공항', lat: 33.5104, lng: 126.4913 },
    { name: '제주항 연안여객터미널', lat: 33.5273, lng: 126.5432 },
    { name: '함덕 해수욕장', lat: 33.5433, lng: 126.6690 },
    { name: '협재 해수욕장', lat: 33.3938, lng: 126.2396 }
  ],
  '제주도': [
    { name: '제주국제공항', lat: 33.5104, lng: 126.4913 },
    { name: '제주항 연안여객터미널', lat: 33.5273, lng: 126.5432 },
    { name: '함덕 해수욕장', lat: 33.5433, lng: 126.6690 },
    { name: '협재 해수욕장', lat: 33.3938, lng: 126.2396 }
  ],
  '제주특별자치도': [
    { name: '제주국제공항', lat: 33.5104, lng: 126.4913 },
    { name: '제주항 연안여객터미널', lat: 33.5273, lng: 126.5432 },
    { name: '함덕 해수욕장', lat: 33.5433, lng: 126.6690 },
    { name: '협재 해수욕장', lat: 33.3938, lng: 126.2396 }
  ],
  '태안': [
    { name: '태안공용버스터미널', lat: 36.7533, lng: 126.3023 },
    { name: '안면도 쥬라기박물관', lat: 36.6521, lng: 126.3622 }
  ],
  '태안군': [
    { name: '태안공용버스터미널', lat: 36.7533, lng: 126.3023 },
    { name: '안면도 쥬라기박물관', lat: 36.6521, lng: 126.3622 }
  ]
};

const DEFAULT_COORDS = { name: '대한민국 중심지', lat: 37.5665, lng: 126.9780 };

const REGION_API_CODES = {
  '서울': '1', '인천': '2', '대전': '3', '대구': '4', '광주': '5', '부산': '6', '울산': '7', '세종': '8',
  '경기': '31', '강원': '32', '충북': '33', '충남': '34', '경북': '35', '경남': '36', '전북': '37', '전남': '38', '제주': '39',
};

// 상위 광역 시도 코드 검출
const getAreaCodeForRegion = (regionName, allPlaces) => {
  if (REGION_API_CODES[regionName]) return REGION_API_CODES[regionName];

  // CSV 주소 기반 접두사 판정
  const match = allPlaces.find(p => p.region === regionName);
  if (match && match.address) {
    const addr = match.address.trim();
    if (addr.startsWith('서울')) return '1';
    if (addr.startsWith('인천')) return '2';
    if (addr.startsWith('대전')) return '3';
    if (addr.startsWith('대구')) return '4';
    if (addr.startsWith('광주')) return '5';
    if (addr.startsWith('부산')) return '6';
    if (addr.startsWith('울산')) return '7';
    if (addr.startsWith('세종')) return '8';
    if (addr.startsWith('경기') || addr.startsWith('가평') || addr.startsWith('양평') || addr.startsWith('남양주')) return '31';
    if (addr.startsWith('강원') || addr.startsWith('강릉') || addr.startsWith('속초') || addr.startsWith('춘천')) return '32';
    if (addr.startsWith('충북') || addr.startsWith('충청북도')) return '33';
    if (addr.startsWith('충남') || addr.startsWith('충청남도') || addr.startsWith('태안') || addr.startsWith('보령')) return '34';
    if (addr.startsWith('경북') || addr.startsWith('경상북도')) return '35';
    if (addr.startsWith('경남') || addr.startsWith('경상남도') || addr.startsWith('밀양')) return '36';
    if (addr.startsWith('전북') || addr.startsWith('전라북도')) return '37';
    if (addr.startsWith('전남') || addr.startsWith('전라남도') || addr.startsWith('여수')) return '38';
    if (addr.startsWith('제주') || addr.startsWith('서귀포')) return '39';
  }

  // 소도시 수동 폴백
  const name = regionName || '';
  if (name.includes('강릉') || name.includes('속초') || name.includes('춘천') || name.includes('원주') || name.includes('양양') || name.includes('영월') || name.includes('평창') || name.includes('고성') || name.includes('홍천')) return '32';
  if (name.includes('가평') || name.includes('양평') || name.includes('남양주') || name.includes('김포') || name.includes('의정부') || name.includes('고양')) return '31';
  if (name.includes('태안') || name.includes('보령') || name.includes('천안') || name.includes('아산')) return '34';
  if (name.includes('여수') || name.includes('순천') || name.includes('목포')) return '38';
  if (name.includes('밀양') || name.includes('거제') || name.includes('남해') || name.includes('통영')) return '36';
  if (name.includes('제주') || name.includes('서귀포')) return '39';

  return '32'; // 최종 폴백 기본값 (강원)
};

// 상위 광역 시도명 검출 헬퍼
const getProvinceForRegion = (regionName, allPlaces) => {
  if (!regionName || !allPlaces) return '강원도';

  // 1차 필터링
  if (['서울', '서울특별시'].includes(regionName)) return '서울특별시';
  if (['인천', '인천광역시'].includes(regionName)) return '인천광역시';
  if (['대전', '대전광역시'].includes(regionName)) return '대전광역시';
  if (['대구', '대구광역시'].includes(regionName)) return '대구광역시';
  if (['광주', '광주광역시'].includes(regionName)) return '광주광역시';
  if (['부산', '부산광역시'].includes(regionName)) return '부산광역시';
  if (['울산', '울산광역시'].includes(regionName)) return '울산광역시';
  if (['세종', '세종특별자치시'].includes(regionName)) return '세종특별자치시';
  if (['경기', '경기도'].includes(regionName)) return '경기도';
  if (['강원', '강원도'].includes(regionName)) return '강원도';
  if (['충북', '충청북도'].includes(regionName)) return '충청북도';
  if (['충남', '충청남도'].includes(regionName)) return '충청남도';
  if (['경북', '경상북도'].includes(regionName)) return '경상북도';
  if (['경남', '경상남도'].includes(regionName)) return '경상남도';
  if (['전북', '전라북도'].includes(regionName)) return '전라북도';
  if (['전남', '전라남도'].includes(regionName)) return '전라남도';
  if (['제주', '제주도', '제주특별자치도'].includes(regionName)) return '제주특별자치도';

  // CSV 접두사 판정
  const match = allPlaces.find(p => p.region === regionName);
  if (match && match.address) {
    const addr = match.address.trim();
    if (addr.startsWith('서울')) return '서울특별시';
    if (addr.startsWith('인천')) return '인천광역시';
    if (addr.startsWith('대전')) return '대전광역시';
    if (addr.startsWith('대구')) return '대구광역시';
    if (addr.startsWith('광주') && !addr.includes('경기도')) return '광주광역시';
    if (addr.startsWith('부산')) return '부산광역시';
    if (addr.startsWith('울산')) return '울산광역시';
    if (addr.startsWith('세종')) return '세종특별자치시';
    if (addr.startsWith('경기') || addr.startsWith('가평') || addr.startsWith('양평') || addr.startsWith('남양주')) return '경기도';
    if (addr.startsWith('강원') || addr.startsWith('강릉') || addr.startsWith('속초') || addr.startsWith('춘천')) return '강원도';
    if (addr.startsWith('충북') || addr.startsWith('충청북도')) return '충청북도';
    if (addr.startsWith('충남') || addr.startsWith('충청남도') || addr.startsWith('태안') || addr.startsWith('보령')) return '충청남도';
    if (addr.startsWith('경북') || addr.startsWith('경상북도')) return '경상북도';
    if (addr.startsWith('경남') || addr.startsWith('경상남도') || addr.startsWith('밀양')) return '경상남도';
    if (addr.startsWith('전북') || addr.startsWith('전라북도')) return '전라북도';
    if (addr.startsWith('전남') || addr.startsWith('전라남도') || addr.startsWith('여수')) return '전라남도';
    if (addr.startsWith('제주') || addr.startsWith('서귀포')) return '제주특별자치도';
  }

  // 소도시 수동 폴백
  const name = regionName || '';
  if (name.includes('강릉') || name.includes('속초') || name.includes('춘천') || name.includes('원주') || name.includes('양양') || name.includes('영월') || name.includes('평창') || name.includes('고성') || name.includes('홍천')) return '강원도';
  if (name.includes('가평') || name.includes('양평') || name.includes('남양주') || name.includes('김포') || name.includes('의정부') || name.includes('고양')) return '경기도';
  if (name.includes('태안') || name.includes('보령') || name.includes('천안') || name.includes('아산')) return '충청남도';
  if (name.includes('여수') || name.includes('순천') || name.includes('목포')) return '전라남도';
  if (name.includes('밀양') || name.includes('거제') || name.includes('남해') || name.includes('통영')) return '경상남도';
  if (name.includes('제주') || name.includes('서귀포')) return '제주특별자치도';

  return '강원도'; // 최종 폴백 기본값
};

export default function App() {
  // --- States ---
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
  const [regionInput, setRegionInput] = useState('강릉');
  const [selectedRegion, setSelectedRegion] = useState('강릉');
  const [showRegionSuggestions, setShowRegionSuggestions] = useState(false);

  // 시작 중심지 검색 & 후보군 상태
  const [startSearchInput, setStartSearchInput] = useState('강릉역 (KTX)');
  const [startPlaceName, setStartPlaceName] = useState('강릉역 (KTX)');
  const [startCoords, setStartCoords] = useState({ lat: 37.7638, lng: 128.8995 });
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [startSuggestions, setStartSuggestions] = useState([]);

  // --- 날짜 계산 헬퍼 ---
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getFutureDateString = (daysAhead) => {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 여행 기간 날짜 상태 (기본 오늘 ~ 내일, 1박2일)
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getFutureDateString(1));

  // 일정 계획용 메인 상태
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [cart, setCart] = useState([]);

  // 최적화 생성 일정 관련
  const [isOptimized, setIsOptimized] = useState(false);
  const [optimizedSchedule, setOptimizedSchedule] = useState({});
  const [activeDayTab, setActiveDayTab] = useState('Day 1');

  // --- 1. CSV 데이터 페칭 ---
  useEffect(() => {
    const loadCSVData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${import.meta.env.BASE_URL}data.csv`);
        if (!response.ok) throw new Error("CSV 데이터 로드 실패");
        
        const text = await response.text();
        const parsed = parseCSV(text);
        
        setAllPlaces(parsed);

        const regions = Array.from(new Set(parsed.map(item => item.region)))
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, 'ko'));
        
        setAvailableRegions(regions);

        const gangneungPlaces = parsed.filter(item => item.region === '강릉');
        setPlaces(gangneungPlaces);
        setIsLoading(false);
      } catch (err) {
        console.error("CSV 로드 에러 발생:", err);
        setIsLoading(false);
      }
    };
    loadCSVData();
  }, []);

  // --- 2. 실시간 API 연동 ---
  const fetchLivePetTourData = async (regionName) => {
    const areaCode = getAreaCodeForRegion(regionName, allPlaces);
    const serviceKey = '3659087dc19dc9a8d6764c4ee50be1ce77aeb5816b6562ce997cc0c754fa5529';
    const liveApiUrl = `https://apis.data.go.kr/B551011/KorPetTourService2/areaBasedList2?serviceKey=${serviceKey}&numOfRows=40&pageNo=1&MobileOS=ETC&MobileApp=PetPlanner&_type=json&areaCode=${areaCode}`;
    
    console.log(`[API REQUEST] 실시간 호출 시도: ${liveApiUrl}`);
    setApiLoadStatus('fetching');
    
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
      console.warn(`[CORS / NETWORK BLOCK] API 통신 차단, 로컬 캐시 사용:`, err);
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

  // --- 3. 지역 변경 핸들러 ---
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

    fetchLivePetTourData(region);
  };

  // 시작지 후보 추출
  const getStartCandidates = (region = selectedRegion) => {
    if (RECOMMENDED_LANDMARKS[region]) {
      return RECOMMENDED_LANDMARKS[region];
    }
    
    const norm = region.replace(/(시|군|구|특별자치도|도)$/, '').trim();
    const regionPlaces = allPlaces.filter(p => p.region.includes(norm) || p.address.includes(norm));
    
    const tourists = regionPlaces.filter(p => p.category === 'tourist').slice(0, 4);
    if (tourists.length > 0) {
      return tourists.map(t => ({ name: t.name, lat: t.lat, lng: t.lng }));
    }
    
    const fallbacks = regionPlaces.slice(0, 4);
    if (fallbacks.length > 0) {
      return fallbacks.map(t => ({ name: t.name, lat: t.lat, lng: t.lng }));
    }
    
    if (allPlaces.length > 0) {
      return [{ name: `${region} 중심지`, lat: allPlaces[0].lat, lng: allPlaces[0].lng }];
    }
    return [DEFAULT_COORDS];
  };

  // 시작지 검색 매칭
  useEffect(() => {
    if (!startSearchInput || startSearchInput === startPlaceName) {
      setStartSuggestions([]);
      return;
    }

    if (window.kakao && window.kakao.maps && window.kakao.maps.services && window.kakao.maps.services.Places) {
      try {
        const ps = new window.kakao.maps.services.Places();
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

  // --- 4. 최적화 핸들러 ---
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
    // 1. 복제 숙소 ID 정화
    const targetId = typeof place.id === 'string' && place.id.includes('-hotel-') 
      ? place.id.split('-hotel-')[1] 
      : place.id;

    // 2. 원본 ID로 저장
    const cleanPlace = typeof place.id === 'string' && place.id.includes('-hotel-')
      ? { ...place, id: targetId }
      : place;

    if (cart.some(item => item.id === targetId)) {
      setCart(cart.filter(item => item.id !== targetId));
    } else {
      setCart([...cart, cleanPlace]);
    }
  };

  // 카테고리 & 검색어 필터링
  const getFilteredPlaces = () => {
    if (!allPlaces) return [];
    
    // 지자체 어미 정규화
    const normRegion = selectedRegion ? selectedRegion.replace(/(시|군|구|도|특별자치도)$/, '') : '';

    return allPlaces.filter(place => {
      // 1. 지자체 소속 여부
      const matchesRegion = !selectedRegion || 
                            place.region.includes(normRegion) || 
                            place.address.includes(normRegion);

      // 2. 카테고리 필터
      const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
      
      // 3. 검색어 필터
      const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            place.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesRegion && matchesCategory && matchesSearch;
    });
  };

  // 광역 권역 기준 실시간 필터링
  const getAllFilteredPlaces = () => {
    if (!allPlaces) return [];
    
    // 1. 상위 광역 권역 획득
    const province = getProvinceForRegion(selectedRegion, allPlaces);
    
    // 2. 권역별 필터링
    return allPlaces.filter(place => {
      let isMatch = false;
      const addr = place.address.trim();
      
      if (province === '서울특별시') isMatch = addr.startsWith('서울');
      else if (province === '인천광역시') isMatch = addr.startsWith('인천');
      else if (province === '대전광역시') isMatch = addr.startsWith('대전');
      else if (province === '대구광역시') isMatch = addr.startsWith('대구');
      else if (province === '광주광역시') isMatch = addr.startsWith('광주') && !addr.includes('경기도');
      else if (province === '부산광역시') isMatch = addr.startsWith('부산') || place.region === '부산';
      else if (province === '울산광역시') isMatch = addr.startsWith('울산');
      else if (province === '세종특별자치시') isMatch = addr.startsWith('세종');
      else if (province === '경기도') isMatch = addr.startsWith('경기') || ['가평', '양평', '남양주', '김포', '포천'].includes(place.region);
      else if (province === '강원도') isMatch = addr.startsWith('강원') || ['강릉', '속초', '춘천', '원주', '양양', '영월', '평창', '고성', '삼척', '홍천'].includes(place.region);
      else if (province === '충청북도') isMatch = addr.startsWith('충북') || addr.startsWith('충청북도');
      else if (province === '충청남도') isMatch = addr.startsWith('충남') || addr.startsWith('충청남도') || ['태안', '보령', '천안'].includes(place.region);
      else if (province === '경상북도') isMatch = addr.startsWith('경북') || addr.startsWith('경상북도');
      else if (province === '경상남도') isMatch = addr.startsWith('경남') || addr.startsWith('경상남도') || ['밀양', '거제', '남해', '통영'].includes(place.region);
      else if (province === '전라북도') isMatch = addr.startsWith('전북') || addr.startsWith('전라북도');
      else if (province === '전라남도') isMatch = addr.startsWith('전남') || addr.startsWith('전라남도') || ['여수', '순천'].includes(place.region);
      else if (province === '제주특별자치도') isMatch = addr.startsWith('제주') || ['제주', '제주도', '서귀포'].includes(place.region);

      const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
      const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            place.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      return isMatch && matchesCategory && matchesSearch;
    });
  };

  // --- 5. 로딩 스피너 ---
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

  // --- 6. 스위칭 라우터 ---
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
          allFilteredPlaces={getAllFilteredPlaces()}
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
