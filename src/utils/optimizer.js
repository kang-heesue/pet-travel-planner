/**
 * 두 좌표 간의 직선 거리(km)를 Haversine 공식을 사용하여 계산합니다.
 */
export const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * 관심 장바구니 리스트를 받아 출발 좌표로부터의 거리를 탐욕적으로 계산하여 일차별 최적화된 상세 일정표를 수립합니다.
 * - Nearest Neighbor 정렬 적용
 * - 일차별 균등 분배
 * - 숙소(hotel)는 당일 일정의 맨 마지막에 배치
 * - Day 1의 시작 지점에 시작 중심지 강제 선두 고정
 * - 카테고리별 동적 체류 시간 및 30분 이동 시간 슬롯 지정
 */
export const optimizeSchedule = (cart, daysCount, startCoords, startPlaceName) => {
  if (!cart || cart.length === 0) return {};

  const scheduleDistribution = {};
  for (let d = 1; d <= daysCount; d++) {
    scheduleDistribution[`Day ${d}`] = [];
  }

  // 1. 여행 시작 중심지 노드 생성
  const startNode = {
    id: 'start-landmark-node',
    name: `🏁 ${startPlaceName}`,
    address: '여행 시작 중심지',
    category: 'landmark',
    lat: startCoords.lat,
    lng: startCoords.lng,
    pet_rule: '출발 지점',
    description: '설정한 여행 시작 중심지입니다.',
    open_hours: '24시간',
    phone: ''
  };

  const hotels = cart.filter(p => p.category === 'hotel');
  const nonHotels = cart.filter(p => p.category !== 'hotel');

  // 2. 일반 장소들 Nearest Neighbor 최적 동선 정렬
  const unvisited = [...nonHotels];
  const orderedNonHotels = [];
  let currentLat = startCoords.lat;
  let currentLng = startCoords.lng;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = getDistance(currentLat, currentLng, unvisited[i].lat, unvisited[i].lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    const nextPlace = unvisited.splice(nearestIndex, 1)[0];
    orderedNonHotels.push(nextPlace);
    currentLat = nextPlace.lat;
    currentLng = nextPlace.lng;
  }

  // 3. 일반 장소를 일차별 균등 분배
  orderedNonHotels.forEach((place, index) => {
    const targetDay = (index % daysCount) + 1;
    scheduleDistribution[`Day ${targetDay}`].push(place);
  });

  // 4. 숙소를 일차별 시작과 끝점에 정밀 배치 (Day 1 끝 -> Day 2 시작/끝 -> Day 3 시작 순으로 매끄럽게 연결)
  const finalSchedule = {};

  for (let d = 1; d <= daysCount; d++) {
    const dayKey = `Day ${d}`;
    const dayPlaces = scheduleDistribution[dayKey];

    // 당일 배정할 숙소(끝점용) 결정
    let todayHotel = null;
    if (hotels.length === 1) {
      todayHotel = hotels[0];
    } else if (hotels.length > 1) {
      todayHotel = hotels[d - 1] || hotels[hotels.length - 1];
    }

    // 전날 배정되었던 숙소(시작점용) 결정
    let yesterdayHotel = null;
    if (d > 1) {
      if (hotels.length === 1) {
        yesterdayHotel = hotels[0];
      } else if (hotels.length > 1) {
        yesterdayHotel = hotels[d - 2] || hotels[hotels.length - 1];
      }
    }

    // 당일 일반 장소 목록 정합성 조율 (숙소 중복 방지 필터링)
    let sortedDayPlaces = [...dayPlaces].filter(p => p.category !== 'hotel');

    // 1) 당일 여정 시작 노드 배치
    if (d === 1) {
      sortedDayPlaces = [startNode, ...sortedDayPlaces];
    } else if (yesterdayHotel) {
      // 전날의 끝 숙소가 오늘의 시작 숙소가 되도록 전치 추가 (ID 고유화로 렌더링 키 충돌 방지)
      const dayStartHotelNode = {
        ...yesterdayHotel,
        id: `day-${d}-start-hotel-${yesterdayHotel.id}`
      };
      sortedDayPlaces = [dayStartHotelNode, ...sortedDayPlaces];
    }

    // 2) 당일 여정 종료 노드 배치
    // 마지막 날의 끝에는 이미 전날들의 숙소 배치가 연계되어 있고 추가 연박이 없으므로 숙소를 넣지 않는 것이 자연스럽습니다.
    // 단, N일차(마지막) 전까지는 무조건 끝점에 숙소를 주입합니다.
    if (d < daysCount && todayHotel) {
      const dayEndHotelNode = {
        ...todayHotel,
        id: `day-${d}-end-hotel-${todayHotel.id}`
      };
      sortedDayPlaces.push(dayEndHotelNode);
    } else if (d === daysCount && todayHotel && hotels.length > 1 && d === hotels.length) {
      // 3일 여행에 3개의 다른 숙소를 각각 골랐을 때처럼 명시적 1일 1숙소 분배일 때는 마지막 날 끝에도 숙소를 기재합니다.
      const dayEndHotelNode = {
        ...todayHotel,
        id: `day-${d}-end-hotel-${todayHotel.id}`
      };
      sortedDayPlaces.push(dayEndHotelNode);
    }

    // 5. 세부 시간표 생성 및 슬롯 가산
    let currentHour = 9; // 오전 9시 시작
    let currentMinute = 0;

    const scheduleWithTime = sortedDayPlaces.map((place) => {
      let durationMinutes = 90;
      if (place.category === 'landmark') durationMinutes = 40;
      if (place.category === 'tourist') durationMinutes = 120;
      if (place.category === 'cafe') durationMinutes = 60;
      if (place.category === 'hotel') durationMinutes = 180;

      const startString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      currentMinute += durationMinutes;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
      const endString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      // 다음 장소 이동 시간 30분 일괄 배분
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }

      const durationHoursVal = Math.floor(durationMinutes / 60);
      const durationMinsVal = durationMinutes % 60;
      const durationText = `${durationHoursVal > 0 ? durationHoursVal + '시간 ' : ''}${durationMinsVal > 0 ? durationMinsVal + '분' : ''}`;

      return {
        ...place,
        timeSlot: `${startString} - ${endString}`,
        duration: durationText
      };
    });

    finalSchedule[dayKey] = scheduleWithTime;
  }

  return finalSchedule;
};
