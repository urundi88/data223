import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import cv2
import numpy as np
from PIL import Image, ImageTk
import os
import json
import threading
import time
import sys
import shutil
import tempfile

class VideoEditorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Video Editor with XP Tracker")
        self.root.configure(bg='#2a2a2a')

        # Variáveis de estado
        self.cap = None
        self.current_frame = 0
        self.total_frames = 0
        self.zoom_level = 1.0
        self.max_zoom_level = 10.0
        self.is_playing = False
        self.play_thread = None
        self.saves = {}
        self.session_frame_count = 0
        self.is_video_loaded = False
        self.last_frame_time = -1  # Para debounce
        self.start_time = time.time()  # Tempo de início da sessão
        self.goals = {}  # Sistema de metas
        self.current_goal = {"total_xp": 0, "level": 1}  # Meta atual
        self.is_dragging = False
        self.drag_start_x = 0
        self.drag_start_y = 0
        self.programmed_step = 1  # Passo padrão
        self.programmed_delay = 0.4  # Delay padrão em segundos
        self.fps_mode = False  # Modo FPS
        self.custom_fps = 24  # FPS padrão
        self.temp_clips = {}  # Dicionário para armazenar clipes: {nome: {'start': int, 'end': int, 'loop': int}}
        self.clip_count = 1
        self.recording_state = "Idle"  # Estados: "Idle", "Record", "Play", "Finalize"
        self.current_clip = None
        self.loop_count = 0  # Contador de loops para clipes finitos
        self.temp_dir = tempfile.TemporaryDirectory()
        self.load_saves()
        self.load_goals()

        # Frame principal para layout lado a lado
        self.main_frame = tk.Frame(self.root, bg='#2a2a2a')
        self.main_frame.pack(fill=tk.BOTH, expand=True)

        # Frame esquerdo para botões de multiplicadores
        self.multiplier_frame = tk.Frame(self.main_frame, bg='#2a2a2a', width=200)
        self.multiplier_frame.pack(side=tk.LEFT, fill=tk.Y, padx=5)

        # Botões de multiplicadores em linhas horizontais empilhadas
        multipliers = [1, 2, 3, 4, 5, 6, 7, 9, 10, 20, 30, 50, 60, 100]
        for mult in multipliers:
            row_frame = tk.Frame(self.multiplier_frame, bg='#2a2a2a')
            row_frame.pack(fill=tk.X)
            tk.Button(row_frame, text=f"← {mult}x", command=lambda m=mult: self.step_backward(m), bg='#4a4a4a', fg="#ffffff").pack(side=tk.LEFT, padx=2)
            tk.Button(row_frame, text=f"→ {mult}x", command=lambda m=mult: self.step_forward(m), bg='#4a4a4a', fg="#ffffff").pack(side=tk.LEFT, padx=2)

        # Botões adicionais para 150, 200, 250 frames
        large_step_frame = tk.Frame(self.multiplier_frame, bg='#2a2a2a')
        large_step_frame.pack(fill=tk.X, pady=5)
        tk.Button(large_step_frame, text="← 150", command=lambda: self.step_backward(150), bg='#4a4a4a', fg="#ffffff").pack(side=tk.LEFT, padx=2)
        tk.Button(large_step_frame, text="→ 150", command=lambda: self.step_forward(150), bg='#4a4a4a', fg="#ffffff").pack(side=tk.LEFT, padx=2)
        tk.Button(large_step_frame, text="← 200", command=lambda: self.step_backward(200), bg='#4a4a4a', fg="#ffffff").pack(side=tk.LEFT, padx=2)
        tk.Button(large_step_frame, text="→ 200", command=lambda: self.step_forward(200), bg='#4a4a4a', fg="#ffffff").pack(side=tk.LEFT, padx=2)
        tk.Button(large_step_frame, text="← 250", command=lambda: self.step_backward(250), bg='#4a4a4a', fg="#ffffff").pack(side=tk.LEFT, padx=2)
        tk.Button(large_step_frame, text="→ 250", command=lambda: self.step_forward(250), bg='#4a4a4a', fg="#ffffff").pack(side=tk.LEFT, padx=2)

        # Frame direito para o canvas e outros controles
        self.right_frame = tk.Frame(self.main_frame, bg='#2a2a2a')
        self.right_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)

        # Canvas para exibir o vídeo
        self.canvas = tk.Canvas(self.right_frame, bg='#2a2a2a', highlightthickness=0)
        self.canvas.pack(side=tk.TOP, fill=tk.BOTH, expand=True)
        self.canvas.bind("<MouseWheel>", self.zoom)
        self.canvas.bind("<Button-3>", self.start_drag)  # Botão direito para iniciar arrastar
        self.canvas.bind("<B3-Motion>", self.drag_zoom)  # Arrastar com botão direito
        self.canvas.bind("<ButtonRelease-3>", self.end_drag)  # Soltar botão direito
        self.canvas.bind("<Key>", self.on_key_press)
        self.canvas.focus_set()

        # Frame de botões adicionais
        self.button_frame = tk.Frame(self.right_frame, bg='#2a2a2a')
        self.button_frame.pack(fill=tk.X, pady=5)

        self.first_button = tk.Button(self.button_frame, text="<< First", command=self.first_frame, bg='#4a4a4a', fg="#ffffff")
        self.first_button.pack(side=tk.LEFT, padx=5)

        self.last_button = tk.Button(self.button_frame, text="Last >>", command=self.last_frame, bg='#4a4a4a', fg="#ffffff")
        self.last_button.pack(side=tk.LEFT, padx=5)

        self.play_button = tk.Button(self.button_frame, text="Play", command=self.play_sequence, bg='#4a4a4a', fg="#ffffff")
        self.play_button.pack(side=tk.LEFT, padx=5)

        self.stop_button = tk.Button(self.button_frame, text="Stop", command=self.stop_playback, bg='#4a4a4a', fg="#ffffff")
        self.stop_button.pack(side=tk.LEFT, padx=5)

        self.open_button = tk.Button(self.button_frame, text="Open Video", command=self.open_video, bg='#4a4a4a', fg="#ffffff")
        self.open_button.pack(side=tk.LEFT, padx=5)

        self.set_goal_button = tk.Button(self.button_frame, text="Set Goal", command=self.set_goal_dialog, bg='#4a4a4a', fg="#ffffff")
        self.set_goal_button.pack(side=tk.LEFT, padx=5)

        self.random_button = tk.Button(self.button_frame, text="Random Frames", command=self.random_frame, bg='#4a4a4a', fg="#ffffff")
        self.random_button.pack(side=tk.LEFT, padx=5)

        self.play_programmed_button = tk.Button(self.button_frame, text="Play Programmed", command=self.play_programmed_sequence, bg='#4a4a4a', fg="#ffffff")
        self.play_programmed_button.pack(side=tk.LEFT, padx=5)

        # Frame de entrada
        self.input_frame = tk.Frame(self.right_frame, bg='#2a2a2a')
        self.input_frame.pack(fill=tk.X, pady=5)

        tk.Label(self.input_frame, text="Path:", fg="#ffffff", bg='#2a2a2a').pack(side=tk.LEFT, padx=5)
        self.path_entry = tk.Entry(self.input_frame, bg='#3a3a3a', fg="#ffffff")
        self.path_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)

        # Frame de programação
        self.program_frame = tk.Frame(self.right_frame, bg='#2a2a2a')
        self.program_frame.pack(fill=tk.X, pady=5)

        tk.Label(self.program_frame, text="Step:", fg="#ffffff", bg='#2a2a2a').pack(side=tk.LEFT, padx=5)
        self.step_entry = tk.Entry(self.program_frame, bg='#3a3a3a', fg="#ffffff", width=5)
        self.step_entry.insert(0, "1")
        self.step_entry.pack(side=tk.LEFT, padx=5)

        tk.Label(self.program_frame, text="Delay (s):", fg="#ffffff", bg='#2a2a2a').pack(side=tk.LEFT, padx=5)
        self.delay_entry = tk.Entry(self.program_frame, bg='#3a3a3a', fg="#ffffff", width=5)
        self.delay_entry.insert(0, "0.4")
        self.delay_entry.pack(side=tk.LEFT, padx=5)

        self.fps_var = tk.BooleanVar()
        self.fps_check = tk.Checkbutton(self.program_frame, text="FPS Mode", variable=self.fps_var, bg='#2a2a2a', fg="#ffffff", activebackground='#2a2a2a', activeforeground="#ffffff")
        self.fps_check.pack(side=tk.LEFT, padx=5)

        tk.Label(self.program_frame, text="FPS:", fg="#ffffff", bg='#2a2a2a').pack(side=tk.LEFT, padx=5)
        self.fps_entry = tk.Entry(self.program_frame, bg='#3a3a3a', fg="#ffffff", width=5)
        self.fps_entry.insert(0, "24")
        self.fps_entry.pack(side=tk.LEFT, padx=5)

        # Frame de status
        self.status_frame = tk.Frame(self.right_frame, bg='#2a2a2a')
        self.status_frame.pack(fill=tk.X, pady=5)

        self.status_label = tk.Label(self.status_frame, text="Status: Idle", fg="#ffffff", bg='#2a2a2a')
        self.status_label.pack(side=tk.LEFT, padx=5)

        self.frame_info_label = tk.Label(self.status_frame, text="Frame: 0/0", fg="#ffffff", bg='#2a2a2a')
        self.frame_info_label.pack(side=tk.LEFT, padx=5)

        self.session_frame_count_label = tk.Label(self.status_frame, text="Session Frames: 0", fg="#ffffff", bg='#2a2a2a')
        self.session_frame_count_label.pack(side=tk.LEFT, padx=5)

        self.total_xp_label = tk.Label(self.status_frame, text="Total XP Frames: 0", fg="#ffffff", bg='#2a2a2a')
        self.total_xp_label.pack(side=tk.LEFT, padx=5)

        self.xp_remaining_label = tk.Label(self.status_frame, text="XP Remaining: 0", fg="#ffffff", bg='#2a2a2a')
        self.xp_remaining_label.pack(side=tk.LEFT, padx=5)

        self.xp_gained_label = tk.Label(self.status_frame, text="XP Gained This Session: 0", fg="#ffffff", bg='#2a2a2a')
        self.xp_gained_label.pack(side=tk.LEFT, padx=5)

        self.xp_per_hour_label = tk.Label(self.status_frame, text="XP per Hour: 0", fg="#ffffff", bg='#2a2a2a')
        self.xp_per_hour_label.pack(side=tk.LEFT, padx=5)

        self.time_to_next_level_label = tk.Label(self.status_frame, text="Time to Next Level: --", fg="#ffffff", bg='#2a2a2a')
        self.time_to_next_level_label.pack(side=tk.LEFT, padx=5)

        self.session_time_label = tk.Label(self.status_frame, text="Session Time: 0:00:00", fg="#ffffff", bg='#2a2a2a')
        self.session_time_label.pack(side=tk.LEFT, padx=5)

        self.time_to_goal_label = tk.Label(self.status_frame, text="Time to Goal: --", fg="#ffffff", bg='#2a2a2a')
        self.time_to_goal_label.pack(side=tk.LEFT, padx=5)

        # Barra de progresso clicável
        self.progress_frame = tk.Frame(self.status_frame, bg='#2a2a2a')
        self.progress_frame.pack(side=tk.LEFT, padx=5)
        self.progress_bar = ttk.Scale(self.progress_frame, from_=0, orient=tk.HORIZONTAL, length=200, command=self.on_progress_click)
        self.progress_bar.pack(side=tk.LEFT)
        self.progress_bar.bind("<Button-1>", self.on_progress_click)  # Clique na barra
        self.progress_bar.set(0)

        # Lista de saves
        self.save_frame = tk.Frame(self.right_frame, bg='#2a2a2a')
        self.save_frame.pack(fill=tk.X, pady=5)
        tk.Label(self.save_frame, text="Saves:", fg="#ffffff", bg='#2a2a2a').pack(side=tk.LEFT, padx=5)
        self.save_listbox = tk.Listbox(self.save_frame, bg='#3a3a3a', fg="#ffffff", height=3)
        self.save_listbox.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        self.update_save_list()

        # Frame de clipes temporários
        self.clip_frame = tk.Frame(self.right_frame, bg='#2a2a2a')
        self.clip_frame.pack(fill=tk.X, pady=5)
        tk.Label(self.clip_frame, text="Temp Clips:", fg="#ffffff", bg='#2a2a2a').pack(side=tk.LEFT, padx=5)
        self.clip_listbox = tk.Listbox(self.clip_frame, bg='#3a3a3a', fg="#ffffff", height=3)
        self.clip_listbox.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        self.record_button = tk.Button(self.clip_frame, text="Record Clip", command=self.toggle_recording_state, bg='#4a4a4a', fg="#ffffff")
        self.record_button.pack(side=tk.LEFT, padx=5)
        tk.Button(self.clip_frame, text="Delete Clip", command=self.delete_clip, bg='#4a4a4a', fg="#ffffff").pack(side=tk.LEFT, padx=5)
        tk.Button(self.clip_frame, text="Save to Save", command=self.save_clip_to_save, bg='#4a4a4a', fg="#ffffff").pack(side=tk.LEFT, padx=5)
        self.update_clip_list()

        # Frame para mini-sessão de clipes
        self.clip_control_frame = tk.Frame(self.right_frame, bg='#2a2a2a')
        self.clip_control_frame.pack(fill=tk.X, pady=5)
        self.clip_controls = {}  # Dicionário para armazenar os frames de controle de cada clipe

        # Exibição de goals
        self.goal_frame = tk.Frame(self.right_frame, bg='#2a2a2a')
        self.goal_frame.pack(fill=tk.BOTH, pady=5, expand=True)
        tk.Label(self.goal_frame, text="Goals:", fg="#ffffff", bg='#2a2a2a').pack(side=tk.TOP, padx=5)
        self.goal_layout = tk.Frame(self.goal_frame, bg='#2a2a2a')
        self.goal_layout.pack(fill=tk.BOTH, expand=True)
        self.update_goal_display()

        # Menu
        self.menu = tk.Menu(self.root, bg='#2a2a2a', fg="#ffffff")
        self.root.config(menu=self.menu)

        self.file_menu = tk.Menu(self.menu, tearoff=0, bg='#4a4a4a', fg='#ffffff')
        self.menu.add_cascade(label="File", menu=self.file_menu)
        self.file_menu.add_command(label="Open Video", command=self.open_video)
        self.file_menu.add_command(label="Manage Saves", command=self.manage_saves_dialog)
        self.file_menu.add_separator()
        self.file_menu.add_command(label="Exit", command=self.root.quit)

        # Imagem Tkinter
        self.photo = None

        # Iniciar atualização em tempo real
        self.update_time()

    def load_saves(self):
        try:
            with open("xp_saves.json", "r") as f:
                self.saves = json.load(f)
                for save in self.saves.values():
                    if "clips" not in save:
                        save["clips"] = {}
        except FileNotFoundError:
            self.saves = {}
            print("No xp_saves.json found, creating empty saves.")

    def save_saves(self):
        with open("xp_saves.json", "w") as f:
            json.dump(self.saves, f)

    def load_goals(self):
        try:
            with open("xp_goals.json", "r") as f:
                self.goals = json.load(f)
                if self.goals:
                    self.current_goal = self.goals.get("current", {"total_xp": 0, "level": 1})
        except FileNotFoundError:
            self.goals = {}
            print("No xp_goals.json found, creating empty goals.")

    def save_goals(self):
        self.goals["current"] = self.current_goal
        with open("xp_goals.json", "w") as f:
            json.dump(self.goals, f)

    def open_video(self):
        file_path = filedialog.askopenfilename(filetypes=[("Video files", "*.mp4 *.avi *.mkv")])
        if file_path:
            self.path_entry.delete(0, tk.END)
            self.path_entry.insert(0, file_path)
            if self.cap:
                self.cap.release()
            self.cap = cv2.VideoCapture(file_path)
            print(f"Attempting to open video: {file_path}")
            if not self.cap.isOpened():
                messagebox.showerror("Error", "Failed to open video. Ensure the file is valid or install FFmpeg/K-Lite Codec Pack for MKV support.")
                print("Video capture failed to open.")
                return
            self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
            print(f"Total frames detected: {self.total_frames}")
            self.current_frame = 0
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, self.current_frame)
            self.session_frame_count = 0
            self.start_time = time.time()  # Reinicia o tempo da sessão
            self.progress_bar.config(to=self.total_frames - 1)
            self.is_video_loaded = True
            try:
                ret, frame = self.cap.read()
                if not ret:
                    raise Exception("Failed to read the first frame.")
                print("First frame read successfully.")
                self.update_frame()
                self.status_label.config(text="Status: Video Loaded")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to load video frame: {str(e)}")
                print(f"Error during frame update: {str(e)}")
                self.cap.release()
                self.cap = None

    def update_frame(self):
        if self.cap and self.cap.isOpened() and (self.last_frame_time < 0 or time.time() - self.last_frame_time >= 0.1):
            try:
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, self.current_frame)
                ret, frame = self.cap.read()
                if not ret:
                    print("Failed to read frame.")
                    messagebox.showerror("Error", "Failed to read video frame.")
                    return
                self.session_frame_count += 1
                self.last_frame_time = time.time()

                # Apply zoom
                h, w = frame.shape[:2]
                new_h, new_w = int(h * self.zoom_level), int(w * self.zoom_level)
                frame = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_LINEAR if self.zoom_level < 5 else cv2.INTER_NEAREST)
                
                # Convert to RGB and create PhotoImage
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                img = Image.fromarray(frame_rgb)
                self.photo = ImageTk.PhotoImage(image=img)
                self.canvas.configure(width=new_w, height=new_h)
                self.canvas.create_image(new_w // 2, new_h // 2, image=self.photo)
                
                # Exibir numeração do frame
                self.canvas.delete("frame_number")
                frame_num = self.current_frame + 1
                self.canvas.create_text(10, 10, text=f"Frame: {frame_num}", fill="white", anchor="nw", tags="frame_number")
                
                # Atualizar status e XP
                self.update_status()
            except tk.TclError as e:
                print(f"TclError in update_frame: {str(e)}")
                return

    def update_status(self):
        if self.session_frame_count_label and self.frame_info_label and self.progress_bar and self.total_xp_label and self.xp_remaining_label and self.xp_gained_label and self.xp_per_hour_label:
            self.session_frame_count_label.config(text=f"Session Frames: {self.session_frame_count}")
            self.frame_info_label.config(text=f"Frame: {self.current_frame + 1}/{self.total_frames}")
            self.progress_bar.set(self.current_frame)

            # Calcular XP Totais
            total_xp = self.session_frame_count + sum(save["session_frames"] for save in self.saves.values() if "session_frames" in save)
            self.total_xp_label.config(text=f"Total XP Frames: {total_xp}")

            # Calcular XP Restante e Níveis Restantes para a Meta
            goal_xp = self.current_goal["total_xp"]
            xp_remaining = max(0, goal_xp - total_xp)
            self.xp_remaining_label.config(text=f"XP Remaining: {xp_remaining}")
            levels_remaining = max(0, (goal_xp - total_xp) // 1000)  # Assumindo 1000 XP por nível
            xp_total_to_level = self.current_goal["total_xp"]  # XP total necessário para o nível da meta
            self.update_goal_display(total_xp, xp_remaining, levels_remaining, xp_total_to_level)

            # XP Ganho nesta Sessão
            self.xp_gained_label.config(text=f"XP Gained This Session: {self.session_frame_count}")

            # XP por Hora
            elapsed_time = max(1, time.time() - self.start_time)
            xp_per_hour = (self.session_frame_count / elapsed_time) * 3600
            self.xp_per_hour_label.config(text=f"XP per Hour: {xp_per_hour:.1f}")

    def update_time(self):
        if self.time_to_next_level_label and self.session_time_label and self.time_to_goal_label:
            # Calcular XP Totais
            total_xp = self.session_frame_count + sum(save["session_frames"] for save in self.saves.values() if "session_frames" in save)

            # Tempo para o próximo nível (1000 XP)
            xp_to_next_level = max(0, 1000 - (total_xp % 1000))
            xp_per_hour = float(self.xp_per_hour_label.cget("text").split(": ")[1].rstrip(".0")) if self.xp_per_hour_label.cget("text") != "XP per Hour: 0" else 1
            time_to_next_level = xp_to_next_level / max(1, xp_per_hour / 3600) if xp_per_hour > 0 else "--"
            if time_to_next_level != "--":
                hours, remainder = divmod(time_to_next_level, 1)
                minutes, seconds = divmod(remainder * 60, 1)
                time_to_next_level_str = f"{int(hours):02d}:{int(minutes * 60):02d}:{int(seconds * 60):02d}"
            else:
                time_to_next_level_str = "--"
            self.time_to_next_level_label.config(text=f"Time to Next Level: {time_to_next_level_str}")

            # Tempo nesta sessão
            session_time = time.time() - self.start_time
            hours, remainder = divmod(session_time, 3600)
            minutes, seconds = divmod(remainder, 60)
            self.session_time_label.config(text=f"Session Time: {int(hours):02d}:{int(minutes):02d}:{int(seconds):02d}")

            # Tempo para concluir a meta
            goal_xp = self.current_goal["total_xp"]
            xp_remaining = max(0, goal_xp - total_xp)
            time_to_goal = xp_remaining / max(1, xp_per_hour / 3600) if xp_per_hour > 0 else "--"
            if time_to_goal != "--":
                hours, remainder = divmod(time_to_goal, 1)
                minutes, seconds = divmod(remainder * 60, 1)
                time_to_goal_str = f"{int(hours):02d}:{int(minutes * 60):02d}:{int(seconds * 60):02d}"
            else:
                time_to_goal_str = "--"
            self.time_to_goal_label.config(text=f"Time to Goal: {time_to_goal_str}")

        # Agendar próxima atualização em 1 segundo
        self.root.after(1000, self.update_time)

    def zoom(self, event):
        # Zoom com roda do mouse
        if event.delta > 0:
            self.zoom_level = min(self.zoom_level + 0.5, self.max_zoom_level)
        else:
            self.zoom_level = max(self.zoom_level - 0.5, 0.5)
        self.update_frame()

    def start_drag(self, event):
        # Inicia o arrastar com botão direito
        self.is_dragging = True
        self.drag_start_x = event.x
        self.drag_start_y = event.y

    def drag_zoom(self, event):
        # Ajusta o zoom baseado no movimento vertical (arrastar para cima = zoom in, para baixo = zoom out)
        if self.is_dragging:
            delta_y = event.y - self.drag_start_y
            zoom_change = delta_y * -0.01  # Sensibilidade do zoom
            new_zoom = self.zoom_level + zoom_change
            self.zoom_level = max(0.5, min(self.max_zoom_level, new_zoom))
            self.drag_start_y = event.y
            self.update_frame()

    def end_drag(self, event):
        # Finaliza o arrastar
        self.is_dragging = False

    def on_key_press(self, event):
        if self.cap and self.cap.isOpened():
            if event.keysym == "Left":
                self.step_backward(1)
            else:
                self.step_forward(1)

    def on_progress_click(self, event):
        # Move para o frame correspondente ao clique na barra
        if self.cap and self.cap.isOpened():
            canvas_width = self.progress_bar.winfo_width()
            click_x = event.x
            ratio = click_x / canvas_width
            new_frame = int(ratio * (self.total_frames - 1))
            if 0 <= new_frame < self.total_frames and new_frame != self.current_frame:
                self.current_frame = new_frame
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, self.current_frame)
                self.update_frame()

    def random_frame(self):
        # Gera um frame aleatório com base no total de frames
        if self.cap and self.cap.isOpened():
            self.current_frame = np.random.randint(0, self.total_frames)
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, self.current_frame)
            self.update_frame()

    def manage_saves_dialog(self):
        dialog = tk.Toplevel(self.root, bg='#2a2a2a')
        dialog.title("Manage Saves")
        dialog.geometry("300x250")

        tk.Label(dialog, text="Save Name:", fg="#ffffff", bg='#2a2a2a').pack(pady=5)
        save_name_entry = tk.Entry(dialog, bg='#3a3a3a', fg="#ffffff")
        save_name_entry.pack(pady=5, padx=10, fill=tk.X)

        def save_xp():
            name = save_name_entry.get().strip()
            if name and self.cap:
                self.saves[name] = {"session_frames": self.session_frame_count, "clips": self.temp_clips.copy()}
                self.save_saves()
                messagebox.showinfo("Success", f"Save '{name}' criado com clipes")
                self.update_save_list()

        def load_xp():
            selected = self.save_listbox.get(self.save_listbox.curselection())
            if selected in self.saves:
                self.session_frame_count = self.saves[selected]["session_frames"]
                self.temp_clips = self.saves[selected].get("clips", {})
                self.start_time = time.time()  # Reinicia o tempo ao carregar
                self.update_status()
                self.update_clip_list()
                self.update_clip_controls()
                messagebox.showinfo("Success", f"Save '{selected}' carregado com clipes")

        def overwrite_xp():
            selected = self.save_listbox.get(self.save_listbox.curselection())
            if selected in self.saves:
                self.saves[selected] = {"session_frames": self.session_frame_count, "clips": self.temp_clips.copy()}
                self.save_saves()
                messagebox.showinfo("Success", f"Save '{selected}' sobrescrito com clipes")
                self.update_save_list()

        def delete_xp():
            selected = self.save_listbox.get(self.save_listbox.curselection())
            if selected in self.saves:
                del self.saves[selected]
                self.save_saves()
                messagebox.showinfo("Success", f"Save '{selected}' deletado")
                self.update_save_list()

        save_button = tk.Button(dialog, text="Save", command=save_xp, bg='#4a4a4a', fg="#ffffff")
        save_button.pack(pady=5)

        load_button = tk.Button(dialog, text="Load", command=load_xp, bg='#4a4a4a', fg="#ffffff")
        load_button.pack(pady=5)

        overwrite_button = tk.Button(dialog, text="Overwrite", command=overwrite_xp, bg='#4a4a4a', fg="#ffffff")
        overwrite_button.pack(pady=5)

        delete_button = tk.Button(dialog, text="Delete", command=delete_xp, bg='#4a4a4a', fg="#ffffff")
        delete_button.pack(pady=5)

        dialog.transient(self.root)
        dialog.grab_set()

    def set_goal_dialog(self):
        dialog = tk.Toplevel(self.root, bg='#2a2a2a')
        dialog.title("Set XP Goal")
        dialog.geometry("300x150")

        tk.Label(dialog, text="Total XP Goal:", fg="#ffffff", bg='#2a2a2a').pack(pady=5)
        goal_entry = tk.Entry(dialog, bg='#3a3a3a', fg="#ffffff")
        goal_entry.pack(pady=5, padx=10, fill=tk.X)

        tk.Label(dialog, text="Level:", fg="#ffffff", bg='#2a2a2a').pack(pady=5)
        level_entry = tk.Entry(dialog, bg='#3a3a3a', fg="#ffffff")
        level_entry.insert(0, "1")
        level_entry.pack(pady=5, padx=10, fill=tk.X)

        def set_goal():
            try:
                total_xp = int(goal_entry.get())
                level = int(level_entry.get())
                if total_xp >= 0 and level >= 1:
                    self.current_goal = {"total_xp": total_xp, "level": level}
                    self.save_goals()
                    self.update_status()
                    self.update_goal_display()
                    messagebox.showinfo("Success", f"Goal set to {total_xp} XP, Level {level}")
                    dialog.destroy()
                else:
                    messagebox.showerror("Error", "Invalid XP or Level value")
            except ValueError:
                messagebox.showerror("Error", "Please enter valid numbers")

        tk.Button(dialog, text="Set", command=set_goal, bg='#4a4a4a', fg="#ffffff").pack(pady=10)

        dialog.transient(self.root)
        dialog.grab_set()

    def update_save_list(self):
        self.save_listbox.delete(0, tk.END)
        for save in self.saves.keys():
            self.save_listbox.insert(tk.END, save)

    def update_clip_list(self):
        self.clip_listbox.delete(0, tk.END)
        for clip in self.temp_clips.keys():
            self.clip_listbox.insert(tk.END, clip)

    def update_clip_controls(self):
        for widget in self.clip_control_frame.winfo_children():
            widget.destroy()
        self.clip_controls.clear()
        for clip_name in self.temp_clips:
            clip_frame = tk.Frame(self.clip_control_frame, bg='#2a2a2a')
            clip_frame.pack(fill=tk.X, pady=2)
            tk.Label(clip_frame, text=f"{clip_name}:", fg="#ffffff", bg='#2a2a2a').pack(side=tk.LEFT, padx=5)
            loop_entry = tk.Entry(clip_frame, bg='#3a3a3a', fg="#ffffff", width=5)
            loop_entry.insert(0, str(self.temp_clips[clip_name]["loop"]))
            loop_entry.pack(side=tk.LEFT, padx=5)
            tk.Button(clip_frame, text="Play", command=lambda cn=clip_name, le=loop_entry: self.start_clip(cn, le), bg='#4a4a4a', fg="#ffffff").pack(side=tk.LEFT, padx=5)
            self.clip_controls[clip_name] = {"frame": clip_frame, "loop_entry": loop_entry}

    def update_goal_display(self, total_xp=None, xp_remaining=None, levels_remaining=None, xp_total_to_level=None):
        for widget in self.goal_layout.winfo_children():
            widget.destroy()
        if self.goals and "current" in self.goals:
            if total_xp is None:
                total_xp = self.session_frame_count + sum(save["session_frames"] for save in self.saves.values() if "session_frames" in save)
            if xp_remaining is None:
                xp_remaining = max(0, self.current_goal["total_xp"] - total_xp)
            if levels_remaining is None:
                levels_remaining = max(0, (self.current_goal["total_xp"] - total_xp) // 1000)  # Assumindo 1000 XP por nível
            if xp_total_to_level is None:
                xp_total_to_level = self.current_goal["total_xp"]  # XP total necessário para o nível da meta
            tk.Label(self.goal_layout, text=f"Current Goal: {self.current_goal['total_xp']} XP, Level {self.current_goal['level']}", fg="#ffffff", bg='#2a2a2a').pack(anchor="w", padx=5)
            tk.Label(self.goal_layout, text=f"XP Remaining to Goal: {xp_remaining}", fg="#ffffff", bg='#2a2a2a').pack(anchor="w", padx=5)
            tk.Label(self.goal_layout, text=f"Levels Remaining to Goal: {levels_remaining}", fg="#ffffff", bg='#2a2a2a').pack(anchor="w", padx=5)
            tk.Label(self.goal_layout, text=f"XP Total to Level: {xp_total_to_level}", fg="#ffffff", bg='#2a2a2a').pack(anchor="w", padx=5)
        else:
            tk.Label(self.goal_layout, text="No goals set", fg="#ffffff", bg='#2a2a2a').pack(anchor="w", padx=5)

    def step_forward(self, step):
        if self.cap and self.cap.isOpened():
            self.current_frame = min(self.current_frame + step, self.total_frames - 1)
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, self.current_frame)
            self.update_frame()

    def step_backward(self, step):
        if self.cap and self.cap.isOpened():
            self.current_frame = max(self.current_frame - step, 0)
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, self.current_frame)
            self.update_frame()

    def first_frame(self):
        if self.cap and self.cap.isOpened():
            self.current_frame = 0
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, self.current_frame)
            self.update_frame()

    def last_frame(self):
        if self.cap and self.cap.isOpened():
            max_frame = self.total_frames - 1
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, max_frame)
            ret, _ = self.cap.read()
            while not ret and max_frame > 0:
                max_frame -= 1
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, max_frame)
                ret, _ = self.cap.read()
            self.current_frame = max_frame if ret else 0
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, self.current_frame)
            self.update_frame()
            self.total_frames = max_frame + 1

    def play_sequence(self):
        if self.is_playing or not self.cap:
            return
        self.is_playing = True
        self.play_thread = threading.Thread(target=self._play_sequence_thread)
        self.play_thread.daemon = True
        self.play_thread.start()

    def _play_sequence_thread(self):
        try:
            while self.is_playing and self.current_frame < self.total_frames - 1:
                self.current_frame += 1
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, self.current_frame)
                self.update_frame()
                time.sleep(1.0 / 30.0)  # FPS fixo de 30
        finally:
            self.is_playing = False
            self.play_thread = None

    def play_programmed_sequence(self):
        if self.is_playing or not self.cap:
            return
        self.is_playing = True
        try:
            step = int(self.step_entry.get())
            delay = float(self.delay_entry.get())
            self.fps_mode = self.fps_var.get()
            if self.fps_mode:
                self.custom_fps = float(self.fps_entry.get())
                delay = 1.0 / self.custom_fps
            self.programmed_step = step
            self.programmed_delay = delay
            self.play_thread = threading.Thread(target=self._play_programmed_thread)
            self.play_thread.daemon = True
            self.play_thread.start()
        except ValueError:
            messagebox.showerror("Error", "Please enter valid numbers for Step, Delay, or FPS.")
            self.is_playing = False

    def _play_programmed_thread(self):
        try:
            last_update_time = time.time()
            while self.is_playing and self.current_frame < self.total_frames - 1:
                current_time = time.time()
                if current_time - last_update_time >= self.programmed_delay:
                    self.current_frame = min(self.current_frame + self.programmed_step, self.total_frames - 1)
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, self.current_frame)
                    self.update_frame()
                    last_update_time = current_time
                time.sleep(0.01)  # Pequeno intervalo para evitar sobrecarga
        finally:
            self.is_playing = False
            self.play_thread = None

    def stop_playback(self):
        self.is_playing = False

    def toggle_recording_state(self):
        if not self.cap or not self.is_video_loaded or self.is_playing:
            messagebox.showerror("Error", "Video must be loaded and paused to record.")
            return
        if self.recording_state == "Idle":
            self.current_clip = f"a{self.clip_count}"
            self.temp_clips[self.current_clip] = {"start": self.current_frame, "end": None, "loop": 0}
            self.recording_state = "Record"
            self.record_button.config(text="Play")
            messagebox.showinfo("Info", f"Point A set at frame {self.current_frame}. Move to Point B and click 'Play' to preview, then 'Finalize Record' to save.")
        elif self.recording_state == "Record":
            if self.current_frame <= self.temp_clips[self.current_clip]["start"]:
                messagebox.showerror("Error", "Point B must be greater than Point A.")
            return
            self.temp_clips[self.current_clip]["end"] = self.current_frame
            self.recording_state = "Play"
            self.record_button.config(text="Finalize Record")
            messagebox.showinfo("Info", f"Point B set at frame {self.current_frame}. Click 'Finalize Record' to save, or 'Play' to preview.")
        elif self.recording_state == "Play":
            self.finalize_clip()
            self.recording_state = "Idle"
            self.record_button.config(text="Record Clip")
            self.current_clip = None

    def finalize_clip(self):
        if self.current_clip and self.temp_clips[self.current_clip]["end"] is not None:
            self.save_clip_to_file(self.current_clip, self.temp_clips[self.current_clip]["start"], self.temp_clips[self.current_clip]["end"])
            self.update_clip_list()
            self.update_clip_controls()
            self.clip_count += 1
            messagebox.showinfo("Success", f"Clip {self.current_clip} recorded from frame {self.temp_clips[self.current_clip]['start']} to {self.temp_clips[self.current_clip]['end']}.")

    def save_clip_to_file(self, clip_name, start_frame, end_frame):
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        fps = self.custom_fps
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        ret, frame = self.cap.read()
        if not ret:
            return
        h, w = frame.shape[:2]
        out_path = os.path.join(self.temp_dir.name, f"{clip_name}.mp4")
        out = cv2.VideoWriter(out_path, fourcc, fps, (w, h))
        current_frame = start_frame
        while current_frame <= end_frame and ret:
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame)
            ret, frame = self.cap.read()
            if ret:
                out.write(frame)
            current_frame += 1
        out.release()

    def start_clip(self, clip_name, loop_entry):
        if not self.cap or not self.is_video_loaded or self.is_playing:
            messagebox.showerror("Error", "Video must be loaded and no other playback active.")
            return
        try:
            loop = int(loop_entry.get())
            self.temp_clips[clip_name]["loop"] = loop if loop > 0 else 0  # 0 para infinito
            self.current_clip = clip_name
            self.is_playing = True
            self.loop_count = 0
            self.play_thread = threading.Thread(target=self._play_clip_thread, args=(clip_name,))
            self.play_thread.daemon = True
            self.play_thread.start()
        except ValueError:
            messagebox.showerror("Error", "Please enter a valid number of loops (0 for infinite).")

    def _play_clip_thread(self, clip_name):
        try:
            start_frame = self.temp_clips[clip_name]["start"]
            end_frame = self.temp_clips[clip_name]["end"]
            loop_limit = self.temp_clips[clip_name]["loop"]
            while self.is_playing and self.cap and self.cap.isOpened():
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
                self.current_frame = start_frame
                while self.is_playing and self.current_frame <= end_frame and self.cap.isOpened():
                    self.update_frame()
                    delay = 1.0 / min(self.custom_fps, 60)
                    time.sleep(max(0.001, delay))
                    self.current_frame += 1
                    self.root.update()
                if loop_limit > 0 and self.loop_count >= loop_limit - 1:
                    break
                self.loop_count += 1
        except Exception as e:
            print(f"Error playing clip: {str(e)}")
            messagebox.showerror("Error", f"Clip playback failed: {str(e)}")
        finally:
            self.is_playing = False
            self.play_thread = None
            self.current_clip = None
            self.loop_count = 0

    def delete_clip(self):
        selected = self.clip_listbox.get(self.clip_listbox.curselection())
        if selected in self.temp_clips:
            del self.temp_clips[selected]
            clip_path = os.path.join(self.temp_dir.name, f"{selected}.mp4")
            if os.path.exists(clip_path):
                os.remove(clip_path)
            if selected in self.clip_controls:
                self.clip_controls[selected]['frame'].destroy()
                del self.clip_controls[selected]
            self.update_clip_list()
            messagebox.showinfo("Success", f"Clip {selected} deleted.")

    def save_clip_to_save(self):
        selected = self.clip_listbox.get(self.clip_listbox.curselection())
        if selected in self.temp_clips and self.save_listbox.curselection():
            save_name = self.save_listbox.get(self.save_listbox.curselection())
            if save_name in self.saves:
                if "clips" not in self.saves[save_name]:
                    self.saves[save_name]["clips"] = {}
                self.saves[save_name]["clips"][selected] = self.temp_clips[selected]
                self.save_saves()
                messagebox.showinfo("Success", f"Clip {selected} saved to {save_name}.")
            else:
                messagebox.showerror("Error", "No save selected.")

    def cleanup(self):
        self.stop_playback()
        self.save_saves()
        self.save_goals()
        if self.cap:
            self.cap.release()
        if hasattr(self, 'temp_dir') and self.temp_dir:
            self.temp_dir.cleanup()
        self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = VideoEditorApp(root)
    root.protocol("WM_DELETE_WINDOW", app.cleanup)
    root.mainloop()