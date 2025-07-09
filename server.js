import express from "express";
import bodyParser from "body-parser";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { format, utcToZonedTime } from "date-fns-tz";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.post("/gerar-pdf", async (req, res) => {
  const { cnpj, razaoSocial, nomeFantasia } = req.body;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let cursorY = height - 10;

  // Adiciona logo
  const logoBytes = fs.readFileSync(path.join(__dirname, "logo-pagbank.png"));
  const pngImage = await pdfDoc.embedPng(logoBytes);
  const pngDims = pngImage.scale(0.22);

  page.drawImage(pngImage, {
    x: (width - pngDims.width) / 2,
    y: cursorY - pngDims.height,
    width: pngDims.width,
    height: pngDims.height,
  });

  cursorY -= pngDims.height + 20;

  // Título
  const title = "Proposta Comercial";
  const titleSize = 22;
  const titleWidth = fontBold.widthOfTextAtSize(title, titleSize);

  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: cursorY,
    size: titleSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  cursorY -= 30;

  // Dados da empresa
  page.drawText(`CNPJ: ${cnpj}`, {
    x: 50,
    y: cursorY,
    size: 11,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  cursorY -= 20;

  page.drawText(`Razão Social: ${razaoSocial}`, {
    x: 50,
    y: cursorY,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  cursorY -= 16;

  page.drawText(`Nome Fantasia: ${nomeFantasia}`, {
    x: 50,
    y: cursorY,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  cursorY -= 20;

  // Data/Hora com fuso horário de São Paulo
  const timeZone = "America/Sao_Paulo";
  const now = new Date();
  const zonedDate = utcToZonedTime(now, timeZone);
  const formattedDate = format(zonedDate, "dd/MM/yyyy, HH:mm:ss", { timeZone });

  const dataHora = `Data/Hora: ${formattedDate} (Horário SP)`;

  page.drawText(dataHora, {
    x: 50,
    y: cursorY,
    size: 11,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  cursorY -= 30;

  // Cabeçalho e dados da tabela
  const tableHeaders = ["Tipo", "Master/Visa", "Outras"];
  const tableData = [
    ["DÉBITO", "0,49%", "0,49%"],
    ["CRÉDITO À VISTA", "1,00%", "1,00%"],
    ["CRÉDITO 2X", "1,32%", "1,57%"],
    ["CRÉDITO 3X", "1,61%", "1,89%"],
    ["CRÉDITO 4X", "2,03%", "2,35%"],
    ["CRÉDITO 5X", "2,40%", "2,60%"],
    ["CRÉDITO 6X", "2,96%", "3,22%"],
    ["CRÉDITO 7X", "3,30%", "3,41%"],
    ["CRÉDITO 8X", "3,80%", "3,92%"],
    ["CRÉDITO 9X", "4,02%", "4,23%"],
    ["CRÉDITO 10X", "4,40%", "4,63%"],
    ["CRÉDITO 11X", "4,73%", "4,91%"],
    ["CRÉDITO 12X", "5,01%", "5,23%"],
    ["CRÉDITO 13X", "5,40%", "5,61%"],
    ["CRÉDITO 14X", "5,74%", "5,94%"],
    ["CRÉDITO 15X", "6,01%", "6,23%"],
    ["CRÉDITO 16X", "6,33%", "6,55%"],
    ["CRÉDITO 17X", "6,88%", "7,01%"],
    ["CRÉDITO 18X", "7,55%", "7,89%"],
    ["PIX | QR CODE", "0,00% (isento)", "0,00% (isento)"],
  ];

  const colWidths = [240, 130, 130];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const startX = (width - tableWidth) / 2;
  const rowHeight = 24;
  let y = cursorY;

  // Fundo cabeçalho
  page.drawRectangle({
    x: startX,
    y: y - rowHeight,
    width: tableWidth,
    height: rowHeight,
    color: rgb(0, 0.6, 0.5),
  });

  // Cabeçalhos
  let colX = startX;
  tableHeaders.forEach((header, i) => {
    const cellWidth = colWidths[i];
    const textWidth = fontBold.widthOfTextAtSize(header, 11);
    const textHeight = fontBold.heightAtSize(11);
    const cellCenterX = colX + cellWidth / 2;
    const cellCenterY = y - (rowHeight / 2) - (textHeight / 4);
    page.drawText(header, {
      x: cellCenterX - textWidth / 2,
      y: cellCenterY,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    colX += cellWidth;
  });

  y -= rowHeight;

  // Linhas da tabela
  tableData.forEach((row, idx) => {
    if (idx % 2 === 1) {
      page.drawRectangle({
        x: startX,
        y: y - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.96, 0.96, 0.96),
      });
    }

    colX = startX;
    row.forEach((cell, j) => {
      const cellWidth = colWidths[j];
      const textWidth = fontRegular.widthOfTextAtSize(cell, 10);
      const textHeight = fontRegular.heightAtSize(10);
      const cellCenterY = y - (rowHeight / 2) - (textHeight / 4);

      let textX;
      if (j === 0) {
        textX = colX + 6;
      } else {
        textX = colX + (cellWidth - textWidth) / 2;
      }

      page.drawText(cell, {
        x: textX,
        y: cellCenterY,
        size: 10,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });

      colX += cellWidth;
    });

    y -= rowHeight;
  });

  // Linhas horizontais da tabela
  let yLine = cursorY;
  for (let i = 0; i <= tableData.length + 1; i++) {
    page.drawLine({
      start: { x: startX, y: yLine },
      end: { x: startX + tableWidth, y: yLine },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    yLine -= rowHeight;
  }

  // Linhas verticais da tabela
  let xLine = startX;
  for (let i = 0; i <= colWidths.length; i++) {
    page.drawLine({
      start: { x: xLine, y: cursorY },
      end: { x: xLine, y: yLine + rowHeight },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    if (i < colWidths.length) xLine += colWidths[i];
  }

  const pdfBytes = await pdfDoc.save();

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=Proposta_PagBank_${cnpj.replace(/[^\d]/g, "")}.pdf`,
  });

  res.send(Buffer.from(pdfBytes));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
