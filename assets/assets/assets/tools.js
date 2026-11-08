/* =====================================================
   DEVTOOLSHUB - TOOL CONTROLLER

   Each tool is initialized only on its own page.
   All primary data processing is client-side.
===================================================== */

"use strict";

const ToolUtils = {

  get(id) {
    return document.getElementById(id);
  },

  status(id,message) {
    const element = this.get(id);
    if (element) element.textContent = message;
  },

  async copy(text) {

    if (!navigator.clipboard) {
      throw new Error("Clipboard API unavailable.");
    }

    await navigator.clipboard.writeText(text);

  },

  download(blob,filename) {

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url),1000);

  },

  escapeCSV(value) {

    const text = value == null ? "" : String(value);

    if (/[",\r\n]/.test(text)) {
      return `"${text.replace(/"/g,'""')}"`;
    }

    return text;

  }

};


/* =====================================================
   JSON TO CSV
===================================================== */

function flattenObject(object,prefix="",result={}) {

  Object.entries(object).forEach(([key,value]) => {

    const name = prefix ? `${prefix}.${key}` : key;

    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {

      flattenObject(value,name,result);

    } else {

      result[name] = Array.isArray(value)
        ? JSON.stringify(value)
        : value;

    }

  });

  return result;

}

function initializeJSONTool() {

  const input = ToolUtils.get("json-input");

  if (!input) return;

  const output = ToolUtils.get("csv-output");

  ToolUtils.get("json-sample").addEventListener("click",() => {

    input.value = JSON.stringify([
      {
        name:"Ahmad",
        role:"Developer",
        country:"Pakistan"
      },
      {
        name:"Ali",
        role:"Designer",
        country:"Pakistan"
      },
      {
        name:"Sara",
        role:"Manager",
        country:"United States"
      }
    ],null,2);

  });

  ToolUtils.get("json-convert").addEventListener("click",() => {

    try {

      const data = JSON.parse(input.value);

      if (
        !Array.isArray(data) ||
        !data.length ||
        data.some(item =>
          !item ||
          typeof item !== "object" ||
          Array.isArray(item)
        )
      ) {
        throw new Error("Enter a non-empty array of JSON objects.");
      }

      const rows = data.map(item => flattenObject(item));

      const headers = [
        ...new Set(rows.flatMap(row => Object.keys(row)))
      ];

      const csv = [
        headers.map(ToolUtils.escapeCSV).join(","),
        ...rows.map(row =>
          headers.map(key => ToolUtils.escapeCSV(row[key])).join(",")
        )
      ].join("\r\n");

      output.value = csv;

      ToolUtils.status(
        "json-status",
        `Successfully converted ${data.length} records.`
      );

    } catch(error) {

      output.value = "";

      ToolUtils.status(
        "json-status",
        error instanceof SyntaxError
          ? "Invalid JSON. Check your syntax."
          : error.message
      );

    }

  });

  ToolUtils.get("json-copy").addEventListener("click",async() => {

    if (!output.value) {
      ToolUtils.status("json-status","Convert JSON first.");
      return;
    }

    try {

      await ToolUtils.copy(output.value);

      ToolUtils.status("json-status","CSV copied successfully.");

    } catch {

      ToolUtils.status("json-status","Clipboard unavailable.");

    }

  });

  ToolUtils.get("json-download").addEventListener("click",() => {

    if (!output.value) {
      ToolUtils.status("json-status","Convert JSON first.");
      return;
    }

    const blob = new Blob(
      ["\uFEFF" + output.value],
      {type:"text/csv;charset=utf-8"}
    );

    ToolUtils.download(blob,"devtoolshub-data.csv");

  });

  ToolUtils.get("json-clear").addEventListener("click",() => {

    input.value = "";
    output.value = "";

    ToolUtils.status("json-status","");

  });

}


/* =====================================================
   IMAGE COMPRESSOR
===================================================== */

function initializeImageTool() {

  const fileInput = ToolUtils.get("image-file");

  if (!fileInput) return;

  let sourceImage = null;
  let sourceURL = null;
  let outputURL = null;

  const preview = ToolUtils.get("image-preview");
  const download = ToolUtils.get("image-download");

  fileInput.addEventListener("change",() => {

    const file = fileInput.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

      ToolUtils.status("image-status","Choose a valid image.");
      return;

    }

    if (sourceURL) URL.revokeObjectURL(sourceURL);
    if (outputURL) URL.revokeObjectURL(outputURL);

    outputURL = null;
    download.disabled = true;

    sourceURL = URL.createObjectURL(file);

    const image = new Image();

    image.onload = () => {

      sourceImage = image;

      preview.src = sourceURL;
      preview.classList.remove("hidden");

      ToolUtils.status(
        "image-status",
        `Original: ${image.width} × ${image.height}px`
      );

    };

    image.onerror = () => {
      ToolUtils.status("image-status","Unable to load image.");
    };

    image.src = sourceURL;

  });

  ToolUtils.get("image-quality").addEventListener("input",event => {

    ToolUtils.get("image-quality-value").textContent =
      `${event.target.value}%`;

  });

  ToolUtils.get("image-process").addEventListener("click",() => {

    if (!sourceImage) {

      ToolUtils.status("image-status","Select an image first.");
      return;

    }

    const maxWidth = Number(
      ToolUtils.get("image-width").value
    );

    if (!Number.isFinite(maxWidth) || maxWidth <= 0) {

      ToolUtils.status("image-status","Enter a valid image width.");
      return;

    }

    const format = ToolUtils.get("image-format").value;

    const scale = Math.min(
      1,
      maxWidth / sourceImage.width
    );

    const width = Math.round(sourceImage.width * scale);
    const height = Math.round(sourceImage.height * scale);

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {

      ToolUtils.status("image-status","Canvas is unavailable.");
      return;

    }

    if (format === "image/jpeg") {

      context.fillStyle = "#ffffff";
      context.fillRect(0,0,width,height);

    }

    context.drawImage(sourceImage,0,0,width,height);

    const quality =
      Number(ToolUtils.get("image-quality").value)/100;

    canvas.toBlob(blob => {

      if (!blob) {

        ToolUtils.status("image-status","Image export failed.");
        return;

      }

      if (outputURL) URL.revokeObjectURL(outputURL);

      outputURL = URL.createObjectURL(blob);

      preview.src = outputURL;

      download.disabled = false;

      ToolUtils.get("image-info").textContent =
        `${width} × ${height}px | ${(blob.size/1024).toFixed(1)} KB`;

      ToolUtils.status(
        "image-status",
        "Image processed successfully."
      );

    },format,quality);

  });

  download.addEventListener("click",() => {

    if (!outputURL) return;

    const format = ToolUtils.get("image-format").value;

    const extension = {
      "image/jpeg":"jpg",
      "image/png":"png",
      "image/webp":"webp"
    }[format];

    const link = document.createElement("a");

    link.href = outputURL;
    link.download = `devtoolshub-image.${extension}`;
    link.click();

  });

  window.addEventListener("beforeunload",() => {

    if (sourceURL) URL.revokeObjectURL(sourceURL);
    if (outputURL) URL.revokeObjectURL(outputURL);

  });

}


/* =====================================================
   GLASSMORPHISM GENERATOR
===================================================== */

function initializeGlassTool() {

  const blur = ToolUtils.get("glass-blur");

  if (!blur) return;

  const opacity = ToolUtils.get("glass-opacity");
  const radius = ToolUtils.get("glass-radius");
  const color = ToolUtils.get("glass-color");

  const preview = ToolUtils.get("glass-preview");
  const output = ToolUtils.get("glass-output");

  function update() {

    const b = Number(blur.value);
    const o = Number(opacity.value);
    const r = Number(radius.value);

    const hex = color.value.replace("#","");

    const rgb = [
      parseInt(hex.slice(0,2),16),
      parseInt(hex.slice(2,4),16),
      parseInt(hex.slice(4,6),16)
    ].join(", ");

    ToolUtils.get("glass-blur-value").textContent = `${b}px`;
    ToolUtils.get("glass-opacity-value").textContent = `${o}%`;
    ToolUtils.get("glass-radius-value").textContent = `${r}px`;

    const css = `.glass-card {
  background: rgba(${rgb}, ${(o/100).toFixed(2)});
  backdrop-filter: blur(${b}px);
  -webkit-backdrop-filter: blur(${b}px);
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: ${r}px;
}`;

    output.textContent = css;

    preview.style.background = `rgba(${rgb},${o/100})`;
    preview.style.backdropFilter = `blur(${b}px)`;
    preview.style.webkitBackdropFilter = `blur(${b}px)`;
    preview.style.borderRadius = `${r}px`;

  }

  [blur,opacity,radius,color].forEach(element => {
    element.addEventListener("input",update);
  });

  ToolUtils.get("glass-copy").addEventListener("click",async() => {

    try {

      await ToolUtils.copy(output.textContent);

      ToolUtils.status("glass-status","CSS copied successfully.");

    } catch {

      ToolUtils.status("glass-status","Clipboard unavailable.");

    }

  });

  ToolUtils.get("glass-reset").addEventListener("click",() => {

    blur.value = 14;
    opacity.value = 18;
    radius.value = 20;
    color.value = "#ffffff";

    update();

    ToolUtils.status("glass-status","Settings reset.");

  });

  update();

}


/* =====================================================
   QR GENERATOR
===================================================== */

function initializeQRTool() {

  const input = ToolUtils.get("qr-input");

  if (!input) return;

  const holder = ToolUtils.get("qr-output");

  let generatedCanvas = null;
  let logoURL = null;
  let generationId = 0;

  ToolUtils.get("qr-logo").addEventListener("change",() => {

    if (logoURL) URL.revokeObjectURL(logoURL);

    const file = ToolUtils.get("qr-logo").files[0];

    logoURL = file ? URL.createObjectURL(file) : null;

  });

  ToolUtils.get("qr-generate").addEventListener("click",() => {

    const text = input.value.trim();

    if (!text) {

      ToolUtils.status("qr-status","Enter text or a URL.");
      return;

    }

    if (typeof QRCode === "undefined") {

      ToolUtils.status(
        "qr-status",
        "QR library unavailable. Check your internet connection."
      );

      return;

    }

    const currentGeneration = ++generationId;

    const size = Number(ToolUtils.get("qr-size").value);

    holder.replaceChildren();

    generatedCanvas = null;

    ToolUtils.get("qr-download").disabled = true;

    try {

      new QRCode(holder,{
        text,
        width:size,
        height:size,
        colorDark:"#000000",
        colorLight:"#ffffff",
        correctLevel:QRCode.CorrectLevel.H
      });

    } catch {

      ToolUtils.status("qr-status","QR generation failed.");
      return;

    }

    // QRCode.js renders its canvas asynchronously.
    requestAnimationFrame(() => {

      const canvas = holder.querySelector("canvas");

      if (!canvas || currentGeneration !== generationId) return;

      const finalCanvas = document.createElement("canvas");

      finalCanvas.width = size;
      finalCanvas.height = size;

      const context = finalCanvas.getContext("2d");

      context.drawImage(canvas,0,0,size,size);

      function finish() {

        if (currentGeneration !== generationId) return;

        generatedCanvas = finalCanvas;

        holder.replaceChildren(finalCanvas);

        ToolUtils.get("qr-download").disabled = false;

        ToolUtils.status(
          "qr-status",
          "QR code generated. Scan-test it before sharing."
        );

      }

      if (!logoURL) {

        finish();
        return;

      }

      const logo = new Image();

      logo.onload = () => {

        if (currentGeneration !== generationId) return;

        const logoSize = size * 0.18;
        const padding = size * 0.035;

        const x = (size-logoSize)/2;
        const y = (size-logoSize)/2;

        context.fillStyle = "#ffffff";

        context.beginPath();
        context.roundRect(
          x-padding,
          y-padding,
          logoSize+padding*2,
          logoSize+padding*2,
          8
        );

        context.fill();

        context.drawImage(
          logo,
          x,
          y,
          logoSize,
          logoSize
        );

        finish();

      };

      logo.onerror = finish;
      logo.src = logoURL;

    });

  });

  ToolUtils.get("qr-download").addEventListener("click",() => {

    if (!generatedCanvas) return;

    generatedCanvas.toBlob(blob => {

      if (!blob) return;

      ToolUtils.download(blob,"devtoolshub-qr.png");

    },"image/png");

  });

  window.addEventListener("beforeunload",() => {

    if (logoURL) URL.revokeObjectURL(logoURL);

  });

}


/* =====================================================
   INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded",() => {

  initializeJSONTool();
  initializeImageTool();
  initializeGlassTool();
  initializeQRTool();

});
