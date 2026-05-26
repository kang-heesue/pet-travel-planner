// Haversine 거리(km) 계산
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

// 대표적 NN 정렬 헬퍼 함수
const sortPlacesByNearestNeighbor = (places, startLat, startLng) => {
  const unvisited = [...places];
  const ordered = [];
  let currentLat = startLat;
  let currentLng = startLng;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = getDistance(
        currentLat,
        currentLng,
        unvisited[i].lat,
        unvisited[i].lng,
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    const nextPlace = unvisited.splice(nearestIndex, 1)[0];
    ordered.push(nextPlace);
    currentLat = nextPlace.lat;
    currentLng = nextPlace.lng;
  }
  return ordered;
};

// 식사 시간대 판정 (아침, 점심, 저녁)
const getMealType = (hour, minute) => {
  const timeInMinutes = hour * 60 + minute;
  // 아침 골든타임: 07:30 (450분) ~ 09:30 (570분) 시작
  if (timeInMinutes >= 450 && timeInMinutes <= 570) return 'breakfast';
  // 점심 골든타임: 11:30 (690분) ~ 14:00 (840분) 시작
  if (timeInMinutes >= 690 && timeInMinutes <= 840) return 'lunch';
  // 저녁 골든타임: 17:30 (1050분) ~ 20:00 (1200분) 시작
  if (timeInMinutes >= 1050 && timeInMinutes <= 1200) return 'dinner';
  return null;
};

/**
 * 탐욕 알고리즘 기반 일차별 최적화 상세 일정 생성
 */
export const optimizeSchedule = (
  cart,
  daysCount,
  startCoords,
  startPlaceName,
) => {
  if (!cart || cart.length === 0) return {};

  const scheduleDistribution = {};
  for (let d = 1; d <= daysCount; d++) {
    scheduleDistribution[`Day ${d}`] = [];
  }

  // 1. 여행 시작 중심지 노드 생성
  const startNode = {
    id: 'start-landmark-node',
    name: startPlaceName,
    address: '여행 시작 중심지',
    category: 'landmark',
    lat: startCoords.lat,
    lng: startCoords.lng,
    pet_rule: '출발 지점',
    description: '설정한 여행 시작 중심지입니다.',
    open_hours: '24시간',
    phone: '',
  };

  const hotels = cart.filter((p) => p.category === 'hotel');
  const nonHotels = cart.filter((p) => p.category !== 'hotel');

  // 2. 카테고리 밸런싱 기반 정렬 & 분배 (식당/카페/관광지 쏠림 완전 방지)
  const restaurants = nonHotels.filter(p => p.category === 'restaurant');
  const cafes = nonHotels.filter(p => p.category === 'cafe');
  const attractions = nonHotels.filter(p => p.category !== 'restaurant' && p.category !== 'cafe');

  const orderedRestaurants = sortPlacesByNearestNeighbor(restaurants, startCoords.lat, startCoords.lng);
  const orderedCafes = sortPlacesByNearestNeighbor(cafes, startCoords.lat, startCoords.lng);
  const orderedAttractions = sortPlacesByNearestNeighbor(attractions, startCoords.lat, startCoords.lng);

  // 일차별 누적 시간(분) 트래킹 초기화
  const dayWeights = {};
  for (let d = 1; d <= daysCount; d++) {
    dayWeights[d] = 0;
  }

  // 장소의 고유 특성별 기본 체류 시간 헬퍼
  const getBaseDuration = (place) => {
    if (place.category === 'landmark') return 40;
    if (place.category === 'tourist') return 70;
    if (place.category === 'cafe') return 50;
    if (place.category === 'restaurant') return 60;
    return 60;
  };

  // 로드 밸런싱 기반 장소 분배
  const allocateWithLoadBalancing = (orderedPlaces) => {
    orderedPlaces.forEach((place) => {
      // 현재 예상 누적 소요 시간이 가장 널널하고 적게 잡힌 일차(Day)를 찾습니다.
      let bestDay = 1;
      let minWeight = Infinity;
      for (let d = 1; d <= daysCount; d++) {
        if (dayWeights[d] < minWeight) {
          minWeight = dayWeights[d];
          bestDay = d;
        }
      }
      
      // 최적 일차에 장소 삽입 및 누적 시간 가중치 갱신 (기본 체류 + 가상의 이동 30분)
      scheduleDistribution[`Day ${bestDay}`].push(place);
      dayWeights[bestDay] += (getBaseDuration(place) + 30);
    });
  };

  allocateWithLoadBalancing(orderedRestaurants);
  allocateWithLoadBalancing(orderedCafes);
  allocateWithLoadBalancing(orderedAttractions);

  const finalSchedule = {};

  for (let d = 1; d <= daysCount; d++) {
    const dayKey = `Day ${d}`;
    const dayPlaces = scheduleDistribution[dayKey];
    const isLastDay = d === daysCount;

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

    // 당일 일반 장소 목록 정렬 및 시작/끝점 결합을 위한 당일 시작 지점 설정
    let dayStartLat = startCoords.lat;
    let dayStartLng = startCoords.lng;
    if (d > 1 && yesterdayHotel) {
      dayStartLat = yesterdayHotel.lat;
      dayStartLng = yesterdayHotel.lng;
    }

    // 당일 일반 장소들을 당일 시작 지점 기준으로 2차 재정렬 (지리적 연속 동선 확보)
    const sortedDayPlaces = sortPlacesByNearestNeighbor(
      dayPlaces.filter((p) => p.category !== 'hotel'),
      dayStartLat,
      dayStartLng
    );

    // 시작 노드 및 숙소 결합
    let hasStartNode = false;
    let startNodeItem = null;
    if (d === 1) {
      startNodeItem = startNode;
      hasStartNode = true;
    } else if (yesterdayHotel) {
      const dayStartHotelNode = {
        ...yesterdayHotel,
        id: `day-${d}-start-hotel-${yesterdayHotel.id}`,
      };
      startNodeItem = dayStartHotelNode;
      hasStartNode = true;
    }

    // 마지막 날에는 끝에 숙소 체크인 일정을 완전히 소거하여 널널할 때 저녁 일찍 여정이 조기 마감되도록 유도!
    let hasEndNode = false;
    let endNodeItem = null;
    if (!isLastDay && todayHotel) {
      const dayEndHotelNode = {
        ...todayHotel,
        id: `day-${d}-end-hotel-${todayHotel.id}`,
      };
      endNodeItem = dayEndHotelNode;
      hasEndNode = true;
    }

    // 동적 체류 시간 연산 (0.8 ~ 1.3배 수준 제한)
    let totalBaseRequiredMinutes = 0;
    if (hasStartNode) {
      totalBaseRequiredMinutes += 0;
    }
    sortedDayPlaces.forEach((item) => {
      let baseMin = 60;
      if (item.category === 'landmark') baseMin = 40;
      if (item.category === 'tourist') baseMin = 70;
      if (item.category === 'cafe') baseMin = 50;
      if (item.category === 'restaurant') baseMin = 60;
      totalBaseRequiredMinutes += baseMin;
    });

    let totalJourneyBaseMinutes = totalBaseRequiredMinutes;
    if (totalJourneyBaseMinutes <= 0) totalJourneyBaseMinutes = 180;

    // 스케일 팩터 연산 (상한 1.3배 제한)
    let scaleFactor = 600 / totalJourneyBaseMinutes;
    scaleFactor = Math.max(0.8, Math.min(1.3, scaleFactor));

    // DRY RUN 및 REAL RUN을 지원하는 유동 타임라인 빌더
    const buildTimeline = (startHour, startMin, extraTravelGap) => {
      let currentHour = startHour;
      let currentMinute = Math.round(startMin / 10) * 10; // 10분 단위 반올림
      const timeline = [];
      
      // 당일 아점저 식당 배치 여부 트래킹
      let hasBreakfast = false;
      let hasLunch = false;
      let hasDinner = false;
      let lastMealEndTime = null;

      // 1) 시작 노드 배치
      if (hasStartNode) {
        // 전날 숙소 출발 시 준비대기 없이 0분 퇴실
        const isHotelStart = startNodeItem.category === 'hotel' || startNodeItem.id.includes('-start-hotel-');
        const isStartLandmark = startNodeItem.id === 'start-landmark-node';
        let durationMinutes = 0; // 출발지 대기 시간 0분

        // 시작 분 정렬
        currentMinute = Math.round(currentMinute / 10) * 10;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }

        const startString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        currentMinute += durationMinutes;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }
        const endString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

        timeline.push({
          ...startNodeItem,
          timeSlot: durationMinutes === 0 ? startString : `${startString} - ${endString}`,
          duration: isStartLandmark ? "여행 시작 출발 🏁" : "체크아웃 및 출발 🚗"
        });

        // 출발 이동 시간
        currentMinute += (30 + extraTravelGap);
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }
      }

      // 일반 장소들 시간대별 / 간격별 최적 탐욕적 배치
      const unplaced = [...sortedDayPlaces];
      let prevLat = hasStartNode ? startNodeItem.lat : startCoords.lat;
      let prevLng = hasStartNode ? startNodeItem.lng : startCoords.lng;

      while (unplaced.length > 0) {
        // 매번 장소 일정을 조립하기 전 시작 시점을 10분 단위로 정형화 정돈! (11:14 같은 애매함 원천 차단!)
        currentMinute = Math.round(currentMinute / 10) * 10;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }

        const currentTimeInMins = currentHour * 60 + currentMinute;
        const mealType = getMealType(currentHour, currentMinute);
        
        let currentMealAlreadyPlaced = false;
        if (mealType === 'breakfast' && hasBreakfast) currentMealAlreadyPlaced = true;
        if (mealType === 'lunch' && hasLunch) currentMealAlreadyPlaced = true;
        if (mealType === 'dinner' && hasDinner) currentMealAlreadyPlaced = true;

        let targetIndex = -1;

        // 식사 타임이고, 해당 타임의 식사를 아직 안 먹었고, 남은 식당이 있으면 식당을 1순위로 배치!
        if (mealType && !currentMealAlreadyPlaced) {
          let minDist = Infinity;
          for (let i = 0; i < unplaced.length; i++) {
            if (unplaced[i].category === 'restaurant') {
              const d = getDistance(prevLat, prevLng, unplaced[i].lat, unplaced[i].lng);
              if (d < minDist) {
                minDist = d;
                targetIndex = i;
              }
            }
          }
        }

        // 식사 타임이 아니거나, 이미 식당을 방문했거나, 남은 식당이 없는 경우 일반 장소(식당 제외) 우선 배치
        if (targetIndex === -1) {
          let minDist = Infinity;
          for (let i = 0; i < unplaced.length; i++) {
            if (unplaced[i].category !== 'restaurant') {
              const d = getDistance(prevLat, prevLng, unplaced[i].lat, unplaced[i].lng);
              if (d < minDist) {
                minDist = d;
                targetIndex = i;
              }
            }
          }
        }

        // 남은 장소가 식당뿐인 경우
        if (targetIndex === -1) {
          let minDist = Infinity;
          for (let i = 0; i < unplaced.length; i++) {
            const d = getDistance(prevLat, prevLng, unplaced[i].lat, unplaced[i].lng);
            if (d < minDist) {
              minDist = d;
              targetIndex = i;
            }
          }

          // 직전 식사 이후 최소 180분(3시간) 간격을 줘서 과식을 방지
          if (lastMealEndTime !== null) {
            const gap = currentTimeInMins - lastMealEndTime;
            if (gap < 180) {
              const gapNeeded = 180 - gap;
              currentMinute += gapNeeded;
              if (currentMinute >= 60) {
                currentHour += Math.floor(currentMinute / 60);
                currentMinute = currentMinute % 60;
              }
            }
          }
        }

        const nextPlace = unplaced.splice(targetIndex, 1)[0];
        prevLat = nextPlace.lat;
        prevLng = nextPlace.lng;

        // 카테고리별 체류 시간 및 최대 상한(Cap) 매우 현실적이고 안전하게 제한!
        let baseMinutes = 60;
        let maxCap = 120; // 랜드마크/관광지는 최대 2시간 한정!
        
        if (nextPlace.category === 'landmark') { 
          baseMinutes = 40; 
          maxCap = 90; 
        } else if (nextPlace.category === 'tourist') { 
          baseMinutes = 70; 
          maxCap = 120; // 관광명소 2시간 제한
        } else if (nextPlace.category === 'cafe') { 
          baseMinutes = 50; 
          maxCap = 70; // 카페 최대 1시간 10분
        } else if (nextPlace.category === 'restaurant') { 
          baseMinutes = 60; 
          maxCap = 80; // 식당 최대 1시간 20분
        }

        let durationMinutes = Math.round((baseMinutes * scaleFactor) / 10) * 10;
        durationMinutes = Math.max(30, Math.min(maxCap, durationMinutes));

        // 시작 분 정렬 후 포맷
        currentMinute = Math.round(currentMinute / 10) * 10;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }

        const startString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        currentMinute += durationMinutes;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }

        let wrappedHour = currentHour % 24;
        const endString = `${String(wrappedHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

        // 식당 방문 시 아점저 상태 갱신
        if (nextPlace.category === 'restaurant') {
          const checkMeal = getMealType(currentHour - Math.floor(durationMinutes / 60), currentMinute - (durationMinutes % 60));
          if (checkMeal === 'breakfast' || (currentHour < 11)) hasBreakfast = true;
          else if (checkMeal === 'lunch' || (currentHour >= 11 && currentHour < 16)) hasLunch = true;
          else hasDinner = true;
          
          lastMealEndTime = currentHour * 60 + currentMinute;
        }

        const durationHoursVal = Math.floor(durationMinutes / 60);
        const durationMinsVal = durationMinutes % 60;
        const durationText = `${durationHoursVal > 0 ? durationHoursVal + '시간 ' : ''}${durationMinsVal > 0 ? durationMinsVal + '분' : ''}`;

        timeline.push({
          ...nextPlace,
          timeSlot: `${startString} - ${endString}`,
          duration: durationText
        });

        // 다음 이동 시간 주입
        if (unplaced.length > 0 || hasEndNode) {
          currentMinute += (30 + extraTravelGap);
          if (currentMinute >= 60) {
            currentHour += Math.floor(currentMinute / 60);
            currentMinute = currentMinute % 60;
          }
        }
      }

      // 마지막 숙소 노드 조립 직전도 10분 단위 정돈!
      currentMinute = Math.round(currentMinute / 10) * 10;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }

      // 마지막 숙소 노드 조립
      if (hasEndNode) {
        const startString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        const durationText = "체크인 & 편안한 휴식 🛌";

        timeline.push({
          ...endNodeItem,
          timeSlot: startString,
          duration: durationText
        });
      } else if (isLastDay) {
        // 마지막 날이고 숙소가 생략된 경우, 마지막 일정 시간 뒤에 자연스러운 귀가/종료 노드를 추가해 마무리!
        const lastItem = timeline[timeline.length - 1];
        if (lastItem) {
          const endString = lastItem.timeSlot.split(' - ')[1];
          timeline.push({
            id: 'last-day-end-node',
            name: '집으로 출발 및 여정 종료',
            address: '여정 종료 지점',
            category: 'landmark',
            lat: timeline[timeline.length - 1].lat,
            lng: timeline[timeline.length - 1].lng,
            pet_rule: '여정 마감',
            description: '모든 여행 일정이 안전하게 완료되었습니다. 귀가를 축하합니다!',
            open_hours: '24시간',
            phone: '',
            timeSlot: endString,
            duration: "여정 종료 🎉"
          });
        }
      }

      return {
        timeline,
        endHour: currentHour,
        endMinute: currentMinute
      };
    };

    // 1차 가계산 (Dry Run)
    const dryRunResult = buildTimeline(9, 0, 0);
    const dryEndTimeInMins = dryRunResult.endHour * 60 + dryRunResult.endMinute;

    let finalStartHour = 9;
    let finalStartMin = 0;
    let finalExtraTravelGap = 0;

    // 마지막 날 외 숙소 입실 오토피팅 보정
    if (!isLastDay) {
      const targetCheckInMinutes = 1170; // 19:30 기준
      let earlyDeficit = targetCheckInMinutes - dryEndTimeInMins;

      if (earlyDeficit > 0) {
        // 출발 시간 지연 (최대 90분)
        const startDelay = Math.min(90, earlyDeficit);
        finalStartMin = startDelay;
        if (finalStartMin >= 60) {
          finalStartHour += Math.floor(finalStartMin / 60);
          finalStartMin = finalStartMin % 60;
        }
        earlyDeficit -= startDelay;

        // 이동 시간 동적 가산
        const intervalsCount = sortedDayPlaces.length + (hasStartNode ? 1 : 0) + (hasEndNode ? 1 : 0) - 1;
        if (earlyDeficit > 0 && intervalsCount > 0) {
          const addedGap = Math.floor(earlyDeficit / intervalsCount);
          finalExtraTravelGap = Math.min(15, addedGap); 
        }
      }
    }

    // 2차 실계산 (Real Run)
    const realRunResult = buildTimeline(finalStartHour, finalStartMin, finalExtraTravelGap);
    finalSchedule[dayKey] = realRunResult.timeline;
  }

  return finalSchedule;
};
