interface GenerateTitleBody {
  baseURL: string;
  token: string;
  operation: string;
  body: {
    model: string;
    messages: { role: "system" | "user" | "assistant"; content: string }[];
  };
}

export const generateTitle = async (body: GenerateTitleBody) => {
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${body.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: body.body.model,
      messages: body.body.messages,
    }),
  };

  try {
    const response = await fetch(body.baseURL, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const generateDescription = async (body: GenerateTitleBody) => {
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${body.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: body.body.model,
      messages: body.body.messages,
    }),
  };

  try {
    const response = await fetch(body.baseURL, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

interface GenerateThumbnailBody {
  baseURL: string;
  token: string;
  body: {
    model: string;
    prompt: string;
    image_size: string;
    batch_size: number;
  };
}

export const generateThumbnail = async (body: GenerateThumbnailBody) => {
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${body.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: body.body.model,
      prompt: body.body.prompt,
      image_size: body.body.image_size,
      batch_size: body.body.batch_size,
    }),
  };

  try {
    const response = await fetch(body.baseURL, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
