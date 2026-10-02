/* =========================================================
   CropMate AI — Mock AI engine (rule-based)
   AI-2: Season Checklist Generator
   Mỗi hàm trả về { status, ... } với status:
     'ok'        → đủ dữ liệu, có kết quả
     'uncertain' → AI chưa chắc chắn (kèm kết quả tạm + lý do)
     'error'     → không đủ dữ liệu để đề xuất
   ========================================================= */
(function (global) {
  // Cơ sở tri thức mock: cây trồng → giai đoạn → checklist công việc
  const CHECKLIST_DB = {
    "Lúa": {
      "Đẻ nhánh": [
        "Giữ mực nước ruộng 3–5 cm để lúa đẻ nhánh đều",
        "Bón thúc đợt 1 (NPK) khi lúa được 15–20 ngày",
        "Theo dõi rầy nâu và ốc bươu vàng mật độ thấp",
        "Làm cỏ, tỉa dặm chỗ thưa",
      ],
      "Làm đòng": [
        "Bón thúc đòng (kali) để tăng số hạt/bông",
        "Kiểm tra bệnh khô vằn, đạo ôn lá",
        "Giữ nước ổn định, tránh để ruộng khô hạn",
      ],
      "Trổ bông": [
        "Phun phòng bệnh đạo ôn cổ bông trước/sau trổ",
        "Hạn chế bón đạm muộn để tránh lem lép hạt",
        "Theo dõi thời tiết, tránh mưa lớn giai đoạn trổ",
      ],
      "Thu hoạch": [
        "Thu hoạch khi 85–90% hạt chín vàng",
        "Chuẩn bị máy gặt, phơi/sấy giảm ẩm dưới 14%",
        "Ghi lại năng suất vào nhật ký để tổng kết vụ",
      ],
      default: [
        "Kiểm tra mực nước và tình hình sâu bệnh tổng quát",
        "Bón phân cân đối theo giai đoạn sinh trưởng",
        "Ghi nhật ký đồng ruộng định kỳ 3–5 ngày/lần",
      ],
    },
    "Xoài": {
      "Ra hoa": [
        "Tưới nước vừa phải, tránh sốc ẩm làm rụng hoa",
        "Phun phòng bệnh thán thư hại hoa",
        "Bón kali + bo để tăng tỉ lệ đậu trái",
      ],
      "Nuôi trái": [
        "Tỉa trái, giữ mật độ trái đều trên chùm",
        "Bao trái để hạn chế ruồi vàng và rám nắng",
        "Bón phân nuôi trái định kỳ 15 ngày/lần",
      ],
      default: [
        "Kiểm tra sâu bệnh và tưới tiêu tổng quát",
        "Cắt tỉa cành tạo tán thông thoáng",
      ],
    },
    "Rau ăn lá": {
      "Thu hoạch": [
        "Thu hoạch sáng sớm để rau tươi, giảm héo",
        "Kiểm tra dư lượng, ngưng thuốc BVTV trước thu hoạch",
        "Sơ chế, bảo quản mát và ghi sản lượng",
      ],
      default: [
        "Tưới đủ ẩm 2 lần/ngày, tránh úng",
        "Kiểm tra sâu ăn lá, bọ nhảy",
        "Bón phân hữu cơ hoai, ưu tiên an toàn",
      ],
    },
  };

  /**
   * AI-2: Sinh checklist công việc theo cây trồng + giai đoạn.
   * @param {{crop?:string, stage?:string}} input
   * @returns {{status:string, items?:string[], explanation?:string, confidence?:number, message?:string}}
   */
  function generateSeasonChecklist(input) {
    const crop = (input && input.crop || "").trim();
    const stage = (input && input.stage || "").trim();

    // Trạng thái lỗi: không đủ dữ liệu
    if (!crop) {
      return {
        status: "error",
        message: "Không đủ dữ liệu để đưa ra đề xuất. Vui lòng chọn cây trồng của mùa vụ.",
      };
    }

    const cropDb = CHECKLIST_DB[crop];
    // Trạng thái chưa chắc chắn: cây trồng ngoài cơ sở dữ liệu
    if (!cropDb) {
      return {
        status: "uncertain",
        items: [
          "Kiểm tra mực nước và tình hình sâu bệnh tổng quát",
          "Bón phân cân đối theo giai đoạn sinh trưởng",
          "Ghi nhật ký đồng ruộng định kỳ",
        ],
        explanation: `AI chưa có dữ liệu chuyên sâu cho cây "${crop}". Đây là checklist chung, bạn nên chỉnh sửa cho phù hợp.`,
        confidence: 0.4,
        message: `AI chưa chắc chắn về kết quả với cây trồng "${crop}".`,
      };
    }

    const items = cropDb[stage] || cropDb.default;
    const stageKnown = Boolean(cropDb[stage]);
    const explanation = stageKnown
      ? `Đề xuất dựa trên cây trồng "${crop}" ở giai đoạn "${stage}" — tổng hợp từ quy trình canh tác chuẩn cho giai đoạn này.`
      : `Không xác định rõ giai đoạn "${stage || "(trống)"}" cho "${crop}"; AI dùng checklist tổng quát của cây trồng này.`;

    return {
      status: "ok",
      items,
      explanation,
      confidence: stageKnown ? 0.9 : 0.6,
    };
  }

  global.AI = { generateSeasonChecklist, CHECKLIST_DB };
})(window);
