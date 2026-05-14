    const canvas = document.getElementById('canvas'); // 캔버스 요소 가져오기
    const ctx = canvas.getContext('2d'); // 2D 렌더링 컨텍스트 가져오기
    const energyDisplay = document.getElementById('energy-display'); // 에너지 정보 표시 요소
    
    const hSlider = document.getElementById('heightSlider'); // 높이 슬라이더 요소 가져오기
    const aSlider = document.getElementById('angleSlider'); // 각도 슬라이더 요소 가져오기
    const mSlider = document.getElementById('massSlider'); // 질량 슬라이더 요소 가져오기
    
    const g = 10; // 중력 가속도 10으로 설정 
    const maxTriangleHMeters = 20; // 최대 높이 20m로 설정
    const ballRadiusBase = 20; // 공의 기본 반지름 설정(영향은 딱히 없음)

    let isMoving = false; // 공이 움직이는지 여부를 나타내는 변수
    let startTime = 0; // 시뮬 시작 시간 저장 변수
    let initialH = 20; // 시뮬 시작 시의 초기 높이 저장 변수
    let animationId; // 시뮬 프레임 ID 저장 변수(시뮬 제어용)

    function updateInfo(m, h, v, initialH) { // 에너지 정보 업데이트 함수
        const Ep = m * g * h;                // 위치 에너지 계산
        const totalE = m * g * initialH;     // 초기 역학적 에너지 계산
        const Ek = totalE - Ep;              // 운동 에너지 계산
                                             // 에너지 글씨로
        energyDisplay.innerHTML = `          
            <strong>현재 상태</strong><br>
            - 높이(h): ${h.toFixed(2)} m<br>
            - 속도(v): ${v.toFixed(2)} m/s<br><br>
            
            <strong>1. 위치 에너지</strong><br>
            Ep = mgh<br>
            Ep = ${m} × 10 × ${h.toFixed(2)}<br>
            = ${Ep.toFixed(0)} J<br><br>
            
            <strong>2. 운동 에너지</strong><br>
            Ek = 1/2mv²<br>
            Ek = 0.5 × ${m} × ${v.toFixed(2)}²<br>
            = ${Ek.toFixed(0)} J<br><br>
            
            <strong>3. 역학적 에너지 (보존)</strong><br>
            E = Ep + Ek<br>
            E = ${Ep.toFixed(0)} + ${Ek.toFixed(0)}<br>
            = ${totalE.toFixed(0)} J (일정)
        `;
    }
    function draw() {                               
        ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스 초기화

        const hMeters = isMoving ? calculateCurrentH() : parseInt(hSlider.value); // 현재 높이 계산
        const deg = parseInt(aSlider.value); // 각도 계산
        const m = parseInt(mSlider.value); // 질량 계산(위에서 부터 다 슬라이더로 작동하겠죠^^ + 글씨로)
        
        if (!isMoving) initialH = hMeters; // 시뮬 시작 시 초기 높이 설정
        
        document.getElementById('heightValue').innerText = hSlider.value; // 현재 높이 계산
        document.getElementById('angleValue').innerText = aSlider.value; // 각도 계산
        document.getElementById('massValue').innerText = mSlider.value; // 질량 계산(위에서 부터 다 슬라이더로 작동하겠죠^^ + 계산용)

        const v = Math.sqrt(2 * g * (initialH - hMeters)); // 속도 계산
        updateInfo(m, hMeters, v, initialH); // 에너지 정보 업데이트

        const angleRad = deg * (Math.PI / 180); // 각도를 라디안으로 변환
        let baseScale = 20;                     // 기본 스케일 설정( 20도 이하로 하면  시뮬 화면 빠져 나가더라)
        const rawWPx = deg === 90 ? 0 : (maxTriangleHMeters * baseScale) / Math.tan(angleRad); // 각도에 따른 최대 너비 계산
        if (rawWPx > 800) baseScale = (800 * Math.tan(angleRad)) / maxTriangleHMeters; // 최대 너비가 800px를 넘지 않도록 스케일 조정

        const hPx = maxTriangleHMeters * baseScale; // 높이를 픽셀로 변환
        const wPx = deg === 90 ? 0 : hPx / Math.tan(angleRad); // 너비를 픽셀로 변환
        const ballRadius = ballRadiusBase * (baseScale / 20); // 공의 반지름을 스케일에 맞게 조정
        const startX = (1000 - wPx) / 2; // 삼각형의 시작 X 좌표 계산
        const startY = 550; // 삼각형의 시작 Y 좌표 계산(캔버스 아래쪽에서 시작)

        ctx.beginPath(); // 삼각형 그리기
        ctx.lineWidth = 2; // 선 두께 설정
        ctx.strokeStyle = "black"; // 선 색상 설정
        ctx.moveTo(startX, startY - hPx); // 삼각형의 꼭짓점으로 이동
        ctx.lineTo(startX + wPx, startY); // 삼각형의 밑변으로 이동
        ctx.lineTo(startX, startY); // 삼각형의 시작점으로 이동
        ctx.closePath(); // 경로 닫기
        ctx.stroke(); // 삼각형 그리기

        const ratio = (maxTriangleHMeters - hMeters) / maxTriangleHMeters; // 공의 위치 계산을 위한 비율 계산
        const centerX = (startX + (wPx * ratio)) + ballRadius * Math.sin(angleRad); // 공의 중심 X 좌표 계산
        const centerY = (startY - (hMeters * baseScale)) - ballRadius * Math.cos(angleRad); // 공의 중심 Y 좌표 계산

        ctx.beginPath(); // 공 그리기
        ctx.arc(centerX, centerY, ballRadius, 0, Math.PI * 2); // 공의 원 그리기
        ctx.fillStyle = "black"; // 공의 색상 설정
        ctx.fill(); // 공 채우기
        ctx.closePath(); // 경로 닫기

        ctx.fillStyle = "white"; // 공 위에 질량 텍스트 색상 설정
        ctx.textAlign = "center"; // 텍스트 정렬을 중앙으로 설정
        ctx.fillText(m + "kg", centerX, centerY + 5); // 공 위에 질량 텍스트 그리기

        if (isMoving) {
            if (hMeters <= 0) { isMoving = false; cancelAnimationFrame(animationId); } // 공이 바닥에 닿으면 시뮬 종료
            else { animationId = requestAnimationFrame(draw); } // 다음 프레임 요청
        }
    }

    function calculateCurrentH() {
        const t = (performance.now() - startTime) / 1000; // 시뮬 시작 후 경과 시간 계산(초 단위)
        const rad = parseInt(aSlider.value) * (Math.PI / 180); // 각도를 라디안으로 변환
        const accel = g * Math.sin(rad);  // 가속도 계산(중력 가속도에 각도의 사인값 곱하기)
        const distanceMoved = 0.5 * accel * t * t; // 이동한 거리 계산(등가속도 운동 공식)
        return Math.max(0, initialH - (distanceMoved * Math.sin(rad))); // 현재 높이 계산(초기 높이에서 이동한 거리의 수직 성분을 빼기, 음수 방지)
    }

    startBtn.addEventListener('click', () => {
        if (isMoving) return; // 이미 시뮬이 진행 중이면 무시
        initialH = parseInt(hSlider.value); // 시뮬 시작 시 초기 높이 설정
        if (initialH <= 0) return; // 초기 높이가 0 이하이면 시뮬 시작하지 않음
        startTime = performance.now(); // 시뮬 시작 시간 기록
        isMoving = true; // 시뮬 시작
        draw(); // 첫 프레임 그리기
    });

    resetBtn.addEventListener('click', () => {
        isMoving = false; // 시뮬 정지
        cancelAnimationFrame(animationId); // 애니메이션 프레임 취소
        draw(); // 초기 상태로 다시 그리기
    });

    [hSlider, aSlider, mSlider].forEach(s => s.addEventListener('input', () => { if(!isMoving) draw(); })); // 슬라이더 값이 변경될 때 시뮬이 진행 중이 아니면 즉시 업데이트
    draw(); // 초기 상태 그리기