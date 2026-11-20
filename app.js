// CMD RFI Multi-Agent Command Center - CN8-2 Casa Luna
// Thứ tự xoay vòng ưu tiên: Claude -> Cloudflare -> OpenRouter -> Groq -> Gemini

const STORAGE_KEY = "cmd_rfi_multiagent_keys_v1";

const SAMPLE_RFI_DATA = [
  { id: "RFI-CN82-041", discipline: "Kết cấu / Hầm", title: "Cao độ lanh tô & khe co giãn tường vây hầm B2 trục 4-7", requester: "VICONS", responder: "TVGS DSPcons", sentDate: "2026-11-05", dueDate: "2026-11-12", status: "Open", impact: "Chặn đổ bê tông vách hầm B2 khu vực trục 4-7" },
  { id: "RFI-CN82-044", discipline: "MEP", title: "Vị trí treo ống gió PCCC & máng cáp trục đứng lõi thang", requester: "VICONS", responder: "Thiết kế", sentDate: "2026-11-06", dueDate: "2026-11-13", status: "Open", impact: "Chậm lắp đặt giá treo MEP tầng 3-5, ảnh hưởng tiến độ hoàn thiện" },
  { id: "RFI-CN82-046", discipline: "Mặt dựng / Facade", title: "Chi tiết chân đế khung nhôm kính & chống thấm mép sàn điển hình", requester: "BM Windows", responder: "Schüco / Thiết kế", sentDate: "2026-11-08", dueDate: "2026-11-15", status: "Open", impact: "Chưa chốt bản vẽ shopdrawing mặt dựng khu vực điển hình" },
  { id: "RFI-CN82-049", discipline: "Kiến trúc", title: "Hoàn thiện mẫu gạch sảnh thang máy & đá ốp chân tường", requester: "VICONS", responder: "Chủ đầu tư PMH", sentDate: "2026-11-10", dueDate: "2026-11-18", status: "Pending PMH", impact: "Đang chờ CĐT duyệt mẫu vật tư" },
  { id: "RFI-CN82-052", discipline: "Kết cấu / Thân", title: "Bố trí thép chờ cầu thang bộ lên tầng mái & hố thăm kỹ thuật", requester: "VICONS", responder: "TVGS DSPcons", sentDate: "2026-11-11", dueDate: "2026-11-17", status: "Open", impact: "Ảnh hưởng công tác cốt thép sàn mái trong 48h tới" },
  { id: "RFI-CN82-055", discipline: "ELV / An ninh", title: "Cao độ lắp đặt camera & đầu đọc thẻ kiểm soát ra vào tầng hầm", requester: "VICONS", responder: "Thiết kế", sentDate: "2026-11-12", dueDate: "2026-11-19", status: "Open", impact: "Chưa thống nhất cao độ với hệ thống đèn chiếu sáng hầm" },
  { id: "RFI-CN82-058", discipline: "MEP", title: "Công suất bơm tăng áp & vị trí tủ điều khiển phòng bơm", requester: "VICONS", responder: "Chủ đầu tư PMH", sentDate: "2026-11-13", dueDate: "2026-11-21", status: "Pending PMH", impact: "Đang chờ ý kiến thống nhất từ PMH" },
  { id: "RFI-CN82-061", discipline: "Mặt dựng / Facade", title: "Dung sai khe hở giữa tấm panel mặt dựng và dầm biên", requester: "BM Windows", responder: "TVGS DSPcons", sentDate: "2026-11-14", dueDate: "2026-11-18", status: "Open", impact: "Cần xác nhận dung sai trước khi nghiệm thu đo đạc thực tế" },
  { id: "RFI-CN82-063", discipline: "Kết cấu / Hầm", title: "Xử lý điểm giao cắt ống thoát nước ngầm với đài móng", requester: "VICONS", responder: "Thiết kế", sentDate: "2026-11-09", dueDate: "2026-11-14", status: "Open", impact: "Đang vướng mặt bằng thi công hố thu nước tầng hầm" },
  { id: "RFI-CN82-066", discipline: "Kiến trúc", title: "Chốt phương án bo góc tường thạch cao khu hành lang căn hộ", requester: "VICONS", responder: "Chủ đầu tư PMH", sentDate: "2026-11-15", dueDate: "2026-11-22", status: "Pending PMH", impact: "Chờ PMH phản hồi mẫu hoàn thiện" },
  { id: "RFI-CN82-068", discipline: "MEP", title: "Kiểm tra thông số van cân bằng đường ống nước lạnh tầng 1-4", requester: "VICONS", responder: "TVGS DSPcons", sentDate: "2026-11-16", dueDate: "2026-11-19", status: "Open", impact: "Trễ 1 ngày, cần rà soát sớm để không dồn cuối tuần" },
  { id: "RFI-CN82-070", discipline: "Kết cấu / Thân", title: "Biện pháp gia cường lỗ mở kỹ thuật sàn tầng điển hình", requester: "VICONS", responder: "Thiết kế", sentDate: "2026-11-17", dueDate: "2026-11-20", status: "Open", impact: "Chốt hôm nay để kịp gia công thép sàn đợt tới" }
];

const REFERENCE_DATE = new Date("2026-11-20T00:00:00");

function $(id) { return document.getElementById(id); }

function appendLog(msg, color = "text-slate-100") {
  const box = $("orchestratorLog");
  const line = document.createElement("div");
  line.className = color;
  line.textContent = `> ${msg}`;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

function resetLog() {
  $("orchestratorLog").innerHTML = "";
}

function setAgentState(agentKey, statusText, mode = "idle", modelLabel = null) {
  const card = $(`card-${agentKey}`);
  const dot = $(`dot-${agentKey}`);
  const stateEl = $(`state-${agentKey}`);
  const modelEl = $(`model-${agentKey}`);

  card.classList.remove("agent-active", "agent-done", "agent-fallback");
  dot.classList.remove("bg-slate-300", "bg-blue-500", "bg-green-500", "bg-amber-500", "dot-working");

  if (mode === "active") {
    card.classList.add("agent-active");
    dot.classList.add("bg-blue-500", "dot-working");
  } else if (mode === "done") {
    card.classList.add("agent-done");
    dot.classList.add("bg-green-500");
  } else if (mode === "fallback") {
    card.classList.add("agent-fallback");
    dot.classList.add("bg-amber-500");
  } else {
    dot.classList.add("bg-slate-300");
  }

  stateEl.textContent = statusText;
  if (modelLabel) modelEl.textContent = modelLabel;
}

function loadKeys() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveKeysToUI() {
  const k = loadKeys();
  $("keyClaude").value = k.claude || "";
  $("cfAccountId").value = k.cfAccountId || "";
  $("keyCloudflare").value = k.cloudflare || "";
  $("keyOpenRouter").value = k.openrouter || "";
  $("keyGroq").value = k.groq || "";
  $("keyGemini").value = k.gemini || "";
}

function saveKeysFromUI() {
  const data = {
    claude: $("keyClaude").value.trim(),
    cfAccountId: $("cfAccountId").value.trim(),
    cloudflare: $("keyCloudflare").value.trim(),
    openrouter: $("keyOpenRouter").value.trim(),
    groq: $("keyGroq").value.trim(),
    gemini: $("keyGemini").value.trim()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  $("settingsPanel").classList.add("hidden");
  appendLog("Đã lưu cấu hình API Keys cục bộ trên trình duyệt.", "text-emerald-400");
}

// Xoay vòng model theo thứ tự: Claude -> Cloudflare -> OpenRouter -> Groq -> Gemini
function getOrderedProviders(preferredOrder) {
  const keys = loadKeys();
  const order = preferredOrder || ["claude", "cloudflare", "openrouter", "groq", "gemini"];
  return order.filter((p) => {
    if (p === "cloudflare") return Boolean(keys.cloudflare && keys.cfAccountId);
    return Boolean(keys[p]);
  });
}

async function callLLMWithRotation(systemPrompt, userPrompt, preferredOrder) {
  const keys = loadKeys();
  const available = getOrderedProviders(preferredOrder);

  if (available.length === 0) {
    return { usedDemo: true, provider: "Demo Engine (Không cần key)", text: null };
  }

  for (let i = 0; i < available.length; i++) {
    const provider = available[i];
    try {
      if (provider === "claude") {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": keys.claude,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
            "anthropic-dangerous-direct-browser-access": "true"
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }]
          })
        });
        if (!res.ok) throw new Error(`Claude HTTP ${res.status}`);
        const json = await res.json();
        return { usedDemo: false, provider: "Claude Sonnet", text: json.content?.[0]?.text || "", isFallback: i > 0 };
      }

      if (provider === "openrouter") {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${keys.openrouter}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "anthropic/claude-3.7-sonnet",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ]
          })
        });
        if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
        const json = await res.json();
        return { usedDemo: false, provider: "OpenRouter", text: json.choices?.[0]?.message?.content || "", isFallback: i > 0 };
      }

      if (provider === "groq") {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${keys.groq}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ]
          })
        });
        if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
        const json = await res.json();
        return { usedDemo: false, provider: "Groq Llama-3.3-70B", text: json.choices?.[0]?.message?.content || "", isFallback: i > 0 };
      }

      if (provider === "gemini") {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(keys.gemini)}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }]
          })
        });
        if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
        const json = await res.json();
        const txt = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return { usedDemo: false, provider: "Gemini 2.5 Flash", text: txt, isFallback: i > 0 };
      }

      if (provider === "cloudflare") {
        const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(keys.cfAccountId)}/ai/run/@cf/meta/llama-3.1-8b-instruct`;
        const res = await fetch(cfUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${keys.cloudflare}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ]
          })
        });
        if (!res.ok) throw new Error(`Cloudflare HTTP ${res.status}`);
        const json = await res.json();
        return { usedDemo: false, provider: "Cloudflare AI", text: json.result?.response || "", isFallback: i > 0 };
      }
    } catch (err) {
      appendLog(`⚠️ ${provider} gặp lỗi (${err.message}) -> tự chuyển model tiếp theo...`, "text-amber-300");
    }
  }

  return { usedDemo: true, provider: "Demo Fallback", text: null };
}

function parsePastedRows(rawText) {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const parsed = [];
  for (const line of lines) {
    const cols = line.includes("\t") ? line.split("\t") : line.split("|").map((c) => c.trim());
    if (cols.length >= 6 && !cols[0].toLowerCase().includes("mã rfi")) {
      parsed.push({
        id: cols[0] || "Thiếu mã",
        discipline: cols[1] || "Chưa rõ bộ môn",
        title: cols[2] || "Thiếu nội dung",
        requester: cols[3] || "VICONS",
        responder: cols[4] || "Chưa rõ đơn vị",
        sentDate: cols[5] || "",
        dueDate: cols[6] || "",
        status: cols[7] || "Open",
        impact: cols[8] || "Cần đối chiếu mặt bằng/tiến độ thực tế"
      });
    }
  }
  return parsed.length ? parsed : SAMPLE_RFI_DATA;
}

// Agent 1: Lọc bỏ PMH, tính ngày trễ, chấm điểm khẩn cấp
function runAgent1Triage(rows) {
  const excludedPmh = [];
  const candidates = [];

  for (const r of rows) {
    const respLower = (r.responder || "").toLowerCase();
    const statusLower = (r.status || "").toLowerCase();
    if (respLower.includes("pmh") || respLower.includes("chủ đầu tư") || statusLower.includes("pmh")) {
      excludedPmh.push(r);
      continue;
    }

    let overdueDays = 0;
    let dueLabel = "Thiếu hạn";
    if (r.dueDate) {
      const due = new Date(`${r.dueDate}T00:00:00`);
      if (!isNaN(due.getTime())) {
        const diffDays = Math.floor((REFERENCE_DATE - due) / (1000 * 60 * 60 * 24));
        overdueDays = diffDays;
        dueLabel = diffDays > 0 ? `Trễ ${diffDays} ngày` : diffDays === 0 ? "Hạn hôm nay" : `Còn ${Math.abs(diffDays)} ngày`;
      }
    }

    const impactLower = (r.impact || "").toLowerCase();
    const blocksWork = impactLower.includes("chặn") || impactLower.includes("chậm") || impactLower.includes("48h") || impactLower.includes("vướng") || impactLower.includes("hầm") || impactLower.includes("mặt dựng");
    const urgencyScore = Math.max(0, overdueDays) * 2 + (blocksWork ? 5 : 1);

    candidates.push({
      ...r,
      overdueDays,
      dueLabel,
      urgencyScore,
      isOverdue: overdueDays > 0
    });
  }

  const overdueOnly = candidates
    .filter((x) => x.isOverdue)
    .sort((a, b) => b.urgencyScore - a.urgencyScore);

  return { totalInput: rows.length, excludedPmh, overdueOnly, allNonPmh: candidates };
}

// Agent 2: Phân tích tác động tiến độ & đường găng
function runAgent2Impact(overdueList) {
  return overdueList.map((item) => {
    let riskLevel = "Trung bình";
    let actionNote = "Đôn đốc chốt phản hồi trong kỳ họp tới.";
    if (item.urgencyScore >= 10) {
      riskLevel = "KHẨN CẤP (Đường găng)";
      actionNote = "Chốt gấp trong 24–48h để không đứng mũi thi công / chậm đổ bê tông.";
    } else if (item.urgencyScore >= 6) {
      riskLevel = "Cao";
      actionNote = "Yêu cầu phản hồi trước hạn họp tuần để tránh dồn việc.";
    }
    return { ...item, riskLevel, actionNote };
  });
}

// Agent 3: Soạn Thư cảnh báo & Talking Points
function buildLocalNoticeAndTalking(impactedList, excludedCount, bilingual) {
  const byResponder = {};
  for (const item of impactedList) {
    const key = item.responder || "Đơn vị liên quan";
    if (!byResponder[key]) byResponder[key] = [];
    byResponder[key].push(item);
  }

  let letter = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n---\n\nTHƯ NHẮC & CẢNH BÁO TIẾN ĐỘ PHẢN HỒI RFI\nDự án: CN8-2 (Casa Luna) | Đại diện Chủ đầu tư: Phòng CMD – Khối DE (PMH)\nNgày rà soát: 20/11/2026\n\nKính gửi: Các đơn vị có hồ sơ RFI trễ hạn (đã loại trừ ${excludedCount} RFI đang thuộc trách nhiệm phản hồi của Chủ đầu tư PMH).\n\nNhằm đảm bảo tiến độ thi công tổng thể và không làm gián đoạn đường găng công trường dự án CN8-2 Casa Luna, Phòng CMD đề nghị các đơn vị khẩn trương hoàn tất phản hồi các RFI trễ hạn sau:\n\n`;

  for (const [responder, list] of Object.entries(byResponder)) {
    letter += `■ ĐƠN VỊ CHỊU TRÁCH NHIỆM: ${responder.toUpperCase()}\n`;
    list.forEach((r, idx) => {
      letter += `  ${idx + 1}. [${r.id}] (${r.discipline}) – ${r.title}\n     • Mức độ trễ: ${r.dueLabel} | Mức ưu tiên: ${r.riskLevel}\n     • Tác động hiện trường: ${r.impact}\n`;
    });
    letter += `  -> Yêu cầu phản hồi chính thức chậm nhất trong vòng 48 giờ kể từ ngày phát hành thư này.\n\n`;
  }

  letter += `Đề nghị TVGS DSPcons phối hợp theo dõi, tổng hợp kết quả và báo cáo trực tiếp cho đại diện Chủ đầu tư PMH.\nTrân trọng,\nĐại diện Chủ đầu tư – Phòng CMD (PMH) | Dự án CN8-2 Casa Luna`;

  if (bilingual) {
    letter += `\n\n========================================\nENGLISH SUMMARY (FOR BOP / EXECUTIVE MANAGEMENT)\n========================================\nProject: CN8-2 (Casa Luna) | Employer Representative: CMD Dept, DE Division (PMH)\nDate: 2026-11-20\n\nSummary of Overdue RFIs (excluding ${excludedCount} PMH-pending items): ${impactedList.length} overdue RFIs identified across external/consultant/contractor parties. Immediate 48-hour closure is requested on critical path items affecting basement works, structural sequences, MEP coordination, and facade shopdrawings to protect project milestones.`;
  }

  let talking = `TALKING POINTS HỌP ĐIỀU HÀNH – DỰ ÁN CN8-2 (CASA LUNA)\nNgày: 20/11/2026 | Góc nhìn Chủ đầu tư (PMH – CMD)\n\n1. BỨC TRANH TỔNG QUAN RFI TRỄ HẠN:\n   • Có ${impactedList.length} RFI đang trễ hạn (đã tách riêng ${excludedCount} RFI chờ PMH để nội bộ tự rà soát, không đổ lẫn trách nhiệm).\n\n2. ĐIỂM NGHẼN CẦN CHỐT NGAY TRÊN HIỆN TRƯỜNG:\n`;

  impactedList.slice(0, 5).forEach((item, i) => {
    talking += `   • ${i + 1}. ${item.id} (${item.responder} – ${item.discipline}): ${item.dueLabel}. ${item.actionNote}\n`;
  });

  talking += `\n3. YÊU CẦU CHỐT CAM KẾT TRONG CUỘC HỌP:\n   • Chốt ngày giờ nộp phản hồi cụ thể cho từng mã RFI trễ hạn (không trả lời chung chung).\n   • TVGS DSPcons báo cáo rõ các hạng mục đang kẹt mặt bằng/biện pháp để PMH cân đối phương án điều phối.`;

  return { letter, talking };
}

function renderResults(impactedList, excludedCount, totalInput) {
  $("resultsSection").classList.remove("hidden");
  $("countOverdue").textContent = impactedList.length;

  $("summaryBanner").innerHTML = `
    <strong>Tổng hợp của Tổng quản PMO:</strong> Đã rà soát <strong>${totalInput}</strong> RFI đầu vào → Loại trừ <strong>${excludedCount}</strong> RFI thuộc trách nhiệm PMH → Phát hiện <strong>${impactedList.length}</strong> RFI trễ hạn cần xử lý ngay.
  `;

  const tbody = $("rfiTableBody");
  tbody.innerHTML = "";

  if (impactedList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-500">Không có RFI nào trễ hạn ngoài phạm vi PMH.</td></tr>`;
    return;
  }

  for (const item of impactedList) {
    const tr = document.createElement("tr");
    const badgeClass = item.urgencyScore >= 10
      ? "bg-red-100 text-red-800 border-red-200"
      : "bg-amber-100 text-amber-800 border-amber-200";

    tr.innerHTML = `
      <td class="py-2.5 px-2 font-mono font-semibold text-slate-900 whitespace-nowrap">${item.id}</td>
      <td class="py-2.5 px-2">
        <div class="font-semibold text-slate-800">${item.discipline}</div>
        <div class="text-slate-600">${item.title}</div>
      </td>
      <td class="py-2.5 px-2 font-medium text-slate-800 whitespace-nowrap">${item.responder}</td>
      <td class="py-2.5 px-2 whitespace-nowrap">
        <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}">${item.dueLabel}</span>
      </td>
      <td class="py-2.5 px-2 text-slate-700">
        <div class="font-medium text-slate-900">${item.riskLevel}</div>
        <div class="text-[11px] text-slate-500">${item.impact}</div>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

async function runWorkflow() {
  resetLog();
  $("officeGlobalStatus").textContent = "Đang điều phối...";

  const mode = $("dataSourceMode").value;
  const bilingual = $("bilingualToggle").checked;
  const rawRows = mode === "paste" ? parsePastedRows($("rawSheetInput").value) : SAMPLE_RFI_DATA;

  // 1. Tổng quản nhận lệnh
  setAgentState("orchestrator", "Đang phân công", "active");
  appendLog(`Tổng quản PMO tiếp nhận ${rawRows.length} dòng RFI cho dự án CN8-2 Casa Luna.`);
  await new Promise((r) => setTimeout(r, 350));

  // 2. Agent 1 lọc dữ liệu
  setAgentState("agent1", "Đang lọc PMH...", "active");
  appendLog("Tổng quản giao Agent 1 (Groq/Flash): loại trừ RFI thuộc PMH, tính ngày trễ & điểm khẩn cấp.");
  const agent1Res = await callLLMWithRotation(
    "Bạn là Agent 1 chuyên lọc log RFI dự án xây dựng.",
    `Hãy tóm tắt ngắn gọn kết quả lọc ${rawRows.length} RFI.`,
    ["groq", "gemini", "openrouter", "cloudflare", "claude"]
  );
  const triage = runAgent1Triage(rawRows);
  setAgentState(
    "agent1",
    `Xong (${triage.overdueOnly.length} trễ)`,
    agent1Res.isFallback ? "fallback" : "done",
    agent1Res.provider
  );
  appendLog(`Agent 1 hoàn tất [${agent1Res.provider}]: loại ${triage.excludedPmh.length} RFI của PMH, còn ${triage.overdueOnly.length} RFI trễ hạn.`);
  await new Promise((r) => setTimeout(r, 350));

  // 3. Agent 2 soi tiến độ
  setAgentState("agent2", "Soi đường găng...", "active");
  appendLog("Tổng quản giao Agent 2 (Gemini Pro/Claude): đánh giá mức độ chặn thi công hầm, thân, MEP, mặt dựng.");
  const agent2Res = await callLLMWithRotation(
    "Bạn là chuyên gia phân tích tiến độ thi công dự án cao tầng CN8-2 Casa Luna.",
    `Phân tích mức độ khẩn cấp của ${triage.overdueOnly.length} RFI trễ hạn.`,
    ["gemini", "claude", "openrouter", "groq", "cloudflare"]
  );
  const impacted = runAgent2Impact(triage.overdueOnly);
  setAgentState(
    "agent2",
    "Đã đánh giá",
    agent2Res.isFallback ? "fallback" : "done",
    agent2Res.provider
  );
  appendLog(`Agent 2 hoàn tất [${agent2Res.provider}]: gắn nhãn mức độ ảnh hưởng hiện trường.`);
  await new Promise((r) => setTimeout(r, 350));

  // 4. Agent 3 soạn thư cảnh báo & talking points
  setAgentState("agent3", "Soạn thư cảnh báo...", "active");
  appendLog("Tổng quản giao Agent 3 (Claude): soạn thư nhắc/cảnh báo chuẩn CĐT PMH và Talking Points họp.");
  const localDrafts = buildLocalNoticeAndTalking(impacted, triage.excludedPmh.length, bilingual);

  const agent3Res = await callLLMWithRotation(
    "Bạn là trợ lý điều hành Chủ đầu tư PMH (Phòng CMD), soạn thư cảnh báo RFI và talking points ngắn gọn, thực tế, bám sát số liệu thật.",
    `Dựa trên các dữ liệu sau, hãy trau chuốt lại Thư cảnh báo và Talking Points (bilingual=${bilingual}):\n\nTHƯ NHÁP:\n${localDrafts.letter}\n\nTALKING POINTS:\n${localDrafts.talking}`,
    ["claude", "openrouter", "gemini", "groq", "cloudflare"]
  );

  let finalNotice = localDrafts.letter;
  let finalTalking = localDrafts.talking;

  if (!agent3Res.usedDemo && agent3Res.text && agent3Res.text.includes("TALKING POINTS")) {
    const parts = agent3Res.text.split(/TALKING POINTS/i);
    finalNotice = parts[0].trim();
    finalTalking = "TALKING POINTS" + parts.slice(1).join("TALKING POINTS");
  }

  setAgentState(
    "agent3",
    "Hoàn tất",
    agent3Res.isFallback ? "fallback" : "done",
    agent3Res.provider
  );
  appendLog(`Agent 3 hoàn tất [${agent3Res.provider}]: đã dựng sẵn Thư cảnh báo & Talking Points.`);

  // 5. Tổng quản nghiệm thu kết quả
  renderResults(impacted, triage.excludedPmh.length, triage.totalInput);
  setAgentState("orchestrator", "Đã xuất kết quả", "done");
  $("officeGlobalStatus").textContent = "Hoàn tất rà soát";
  appendLog("Tổng quản PMO: toàn bộ báo cáo đã sẵn sàng ở 3 tab bên dưới.", "text-emerald-400");
}

function copyElementText(elId) {
  const txt = $(elId)?.innerText || "";
  if (!txt) return;
  navigator.clipboard?.writeText(txt).then(() => {
    appendLog("Đã copy nội dung vào clipboard.", "text-sky-300");
  });
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  saveKeysToUI();

  $("btnToggleSettings").addEventListener("click", () => {
    $("settingsPanel").classList.toggle("hidden");
  });

  $("btnSaveKeys").addEventListener("click", saveKeysFromUI);

  $("dataSourceMode").addEventListener("change", (e) => {
    $("pasteBox").classList.toggle("hidden", e.target.value !== "paste");
  });

  $("btnRunWorkflow").addEventListener("click", runWorkflow);

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-btn").forEach((b) => {
        b.classList.remove("text-blue-600", "border-b-2", "border-blue-600", "bg-white");
        b.classList.add("text-slate-600");
      });
      btn.classList.add("text-blue-600", "border-b-2", "border-blue-600", "bg-white");
      btn.classList.remove("text-slate-600");

      document.querySelectorAll(".tab-content").forEach((sec) => sec.classList.add("hidden"));
      $(targetId).classList.remove("hidden");
    });
  });
});
